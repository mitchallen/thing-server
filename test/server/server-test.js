"use strict";

var request = require('supertest'),
    should = require('should');

const TEST_THINGS_HOST = process.env.TEST_THINGS_HOST || 'http://localhost:1234';

describe('server', () => {

    before(done => {
        done();
    });

    after(done => {
        // Call after all tests
        done();
    });

    beforeEach(done => {
        // Call before each test
        done();
    });

    afterEach(done => {
        // Call after each test
        done();
    });

    context('root', () => {

        it('should get status', done => {
            request(TEST_THINGS_HOST)
                .get('/')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res.body);
                    should.exist(res.body.status);
                    res.body.status.should.eql("OK");
                    should.exist(res.body.app);
                    res.body.app.should.eql("thing-server");
                    should.exist(res.body.route);
                    res.body.route.should.eql("/");
                    done();
                });
        });

    });

    context('/v1', () => {

        it('should get status', done => {

            request(TEST_THINGS_HOST)
                .get('/v1')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res.body);
                    should.exist(res.body.status);
                    res.body.status.should.eql("OK");
                    should.exist(res.body.app);
                    res.body.app.should.eql("thing-server");
                    should.exist(res.body.route);
                    res.body.route.should.eql("/v1");
                    done();
                });
        });

        context('/v1/things', () => {

            it('should get things count', done => {
                request(TEST_THINGS_HOST)
                    .get('/v1/things/count')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body.count);
                        done();
                    });
            });

            it('should get things', done => {
                request(TEST_THINGS_HOST)
                    .get('/v1/things')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body);
                        should.exist(res.body.length);
                        should.exist(res.body[0]);
                        done();
                    });
            });

            it('should get things by id', done => {
                request(TEST_THINGS_HOST)
                    .get('/v1/things/1')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body);
                        done();
                    });
            });
        });
    });
});
