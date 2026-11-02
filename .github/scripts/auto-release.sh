#!/usr/bin/env bash
# Helper for .github/workflows/auto-release.yml. The same file is copied into
# every repo; it detects the ecosystem (npm, uv, cargo, go) from the manifest.
#
#   auto-release.sh plan      Is a release due? Writes due/version/reason to
#                             $GITHUB_OUTPUT (stdout when run locally).
#   auto-release.sh prepare   Bump to $VERSION and add its CHANGELOG section.
#   auto-release.sh notes     Print the release notes for $VERSION.
#   auto-release.sh version   Print the version in the manifest.
#
# A release is due when main has changes since the latest tag that reach the
# published image, and every one of those changes was committed by a bot
# (Dependabot). CI, docs and test changes don't count, and neither do
# dev-only dependency bumps. A change made by a person, or a hand-written
# [Unreleased] CHANGELOG entry, means the release is left to be cut by hand.
set -euo pipefail

repo=${GITHUB_REPOSITORY:?set GITHUB_REPOSITORY=owner/name}
out=${GITHUB_OUTPUT:-/dev/stdout}

ecosystem() {
  if [ -f Cargo.toml ]; then echo cargo
  elif [ -f pyproject.toml ]; then echo uv
  elif [ -f package.json ]; then echo npm
  elif [ -f go.mod ]; then echo go
  else echo "auto-release: no supported manifest found" >&2; exit 1
  fi
}

go_version_file() { grep -l '^var version = "' ./*.go | head -1; }

current_version() {
  case $(ecosystem) in
    npm) node -p "require('./package.json').version" ;;
    uv) sed -n 's/^version = "\([0-9.]*\)".*/\1/p' pyproject.toml | head -1 ;;
    cargo) sed -n 's/^version = "\([0-9.]*\)".*/\1/p' Cargo.toml | head -1 ;;
    go) sed -n 's/^var version = "\([0-9.]*\)".*/\1/p' "$(go_version_file)" ;;
  esac
}

latest_tag() { git describe --tags --abbrev=0 --match 'v[0-9]*' HEAD; }

# Files that never reach the published image.
ignored() {
  case $1 in
    .github/* | *.md | docs/* | test/* | tests/* | features/* | *_test.go | \
      LICENSE | Makefile | .gitignore) return 0 ;;
  esac
  return 1
}

# The production view of a manifest or lockfile at a ref, so dev-only bumps
# (test runners, linters, @types/*) don't trigger a release.
npm_prod() {
  case $2 in
    package.json)
      git show "$1:package.json" | jq -S '{dependencies, optionalDependencies,
        peerDependencies, overrides, engines, bin, main, exports, type}' ;;
    package-lock.json)
      git show "$1:package-lock.json" | jq -S '[.packages | to_entries[]
        | select(.key != "" and .value.dev != true)
        | {(.key): .value.version}] | add' ;;
  esac
}

uv_prod() {
  local dir
  dir=$(mktemp -d)
  git show "$1:pyproject.toml" >"$dir/pyproject.toml"
  git show "$1:uv.lock" >"$dir/uv.lock"
  uv export --project "$dir" --frozen --no-dev --no-hashes --no-emit-project \
    --no-header --quiet
  rm -rf "$dir"
}

# True when the file's production view differs between the tag and HEAD.
prod_changed() {
  local tag=$1 file=$2
  git cat-file -e "$tag:$file" 2>/dev/null || return 0
  case $(ecosystem):$file in
    npm:package.json | npm:package-lock.json)
      ! cmp -s <(npm_prod "$tag" "$file") <(npm_prod HEAD "$file") ;;
    uv:pyproject.toml | uv:uv.lock)
      ! cmp -s <(uv_prod "$tag") <(uv_prod HEAD) ;;
    *) return 0 ;;
  esac
}

unreleased_is_empty() {
  [ -f CHANGELOG.md ] || return 0
  awk '/^## \[Unreleased\]/ {f=1; next} f && /^## \[/ {exit} f && NF {found=1}
       END {exit found}' CHANGELOG.md
}

plan() {
  local tag cur version file author
  local -a relevant=() people=()
  tag=$(latest_tag)
  cur=$(current_version)
  version=$(echo "$cur" | awk -F. '{print $1 "." $2 "." $3 + 1}')

  emit() {
    {
      echo "due=$1"
      echo "version=$version"
      echo "tag=$tag"
      echo "reason=$2"
    } >>"$out"
    echo "auto-release: $2" >&2
    exit 0
  }

  [ "v$cur" = "$tag" ] ||
    emit false "version file says $cur but the latest tag is $tag; a release looks half-done"
  if git ls-remote --exit-code --heads origin "auto-release/v$version" >/dev/null; then
    emit false "auto-release/v$version already exists; merge or close its PR first"
  fi

  while IFS= read -r file; do
    ignored "$file" && continue
    prod_changed "$tag" "$file" || continue
    relevant+=("$file")
  done < <(git diff --name-only "$tag" HEAD)
  [ ${#relevant[@]} -gt 0 ] ||
    emit false "nothing since $tag reaches the image (CI, docs, tests or dev deps only)"

  while IFS= read -r author; do
    case $author in *'[bot]') ;; *) people+=("$author") ;; esac
  done < <(git log --format='%an' "$tag..HEAD" -- "${relevant[@]}" | sort -u)
  [ ${#people[@]} -eq 0 ] ||
    emit false "changes since $tag by ${people[*]} need a hand-cut release"
  unreleased_is_empty ||
    emit false "CHANGELOG.md has [Unreleased] entries; cut that release by hand"

  emit true "releasing v$version: ${relevant[*]} changed since $tag"
}

# One bullet per PR merged since the tag, oldest first.
changes() {
  local tag sha
  tag=$(latest_tag)
  git rev-list --first-parent --reverse "$tag..HEAD" | while read -r sha; do
    gh api "repos/$repo/commits/$sha/pulls" \
      --jq '.[0] | select(. != null) | "- \(.title) (#\(.number))"'
  done | awk '!seen[$0]++'
}

notes() {
  : "${VERSION:?}"
  echo "Automated dependency release; no code changes."
  echo
  echo "### Changed"
  echo
  changes
}

prepare() {
  : "${VERSION:?}"
  local tag date section
  tag=$(latest_tag)
  date=$(date -u +%Y-%m-%d)

  case $(ecosystem) in
    npm) npm version "$VERSION" --no-git-tag-version >/dev/null ;;
    uv) uv version "$VERSION" ;;
    cargo)
      awk -v v="$VERSION" '!done && /^version = "[0-9.]+"/ {
        sub(/"[0-9.]+"/, "\"" v "\""); done=1 } { print }' Cargo.toml >Cargo.toml.tmp
      mv Cargo.toml.tmp Cargo.toml
      cargo update --workspace ;;
    go)
      file=$(go_version_file)
      sed -i.bak "s/^var version = \"[0-9.]*\"/var version = \"$VERSION\"/" "$file"
      rm -f "$file.bak" ;;
  esac
  [ "$(current_version)" = "$VERSION" ] ||
    { echo "auto-release: version bump to $VERSION failed" >&2; exit 1; }

  [ -f CHANGELOG.md ] || return 0
  section=$(printf '## [%s] - %s\n\n%s\n' "$VERSION" "$date" "$(notes)")
  SECTION=$section awk '
    /^## \[Unreleased\]/ { print; print ""; print ENVIRON["SECTION"]; next }
    /^\[unreleased\]: / { sub(/compare\/v[0-9.]+\.\.\.HEAD/, "compare/v" V "...HEAD")
                          print; print "[" V "]: " URL "/compare/" T "...v" V; next }
    { print }' V="$VERSION" T="$tag" URL="https://github.com/$repo" \
    CHANGELOG.md >CHANGELOG.md.tmp
  mv CHANGELOG.md.tmp CHANGELOG.md
}

case ${1:-} in
  plan | prepare | notes) "$1" ;;
  version) current_version ;;
  *) echo "usage: $0 plan|prepare|notes|version" >&2; exit 2 ;;
esac
