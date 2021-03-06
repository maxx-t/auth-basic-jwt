"use strict";

const common = require('./common');
const {DEFAULT_ADMIN, makeDefaultUser, request, assert} = common;

const userGetter = (userName) => userName == 'admin' ? DEFAULT_ADMIN : makeDefaultUser(userName);

const auth = require('..');

describe('config', () => {

    describe('secret', () => {

        it('should fail if not set', () => {
            assert.throws(() => auth(null, userGetter), Error, "No secret set")
        });

        it('should fail on use if set with empty promise', (done) => {
            const _auth = auth(Promise.resolve(), userGetter);
            const {ERROR_500_RESPONSE, app, btoa, hasUserMatchingUser, hasToken} = common(_auth);
            request(app)
                .post('/login')
                .set('Authorization', 'Basic ' + btoa('user:pass'))
                .expect(500)
                .expect((res) => res.body == ERROR_500_RESPONSE)
                .end(done);
        });

        it('should fail on use if set with invalid promise return', (done) => {
            const _auth = auth(Promise.resolve(142), userGetter);
            const {ERROR_500_RESPONSE, app, btoa, hasUserMatchingUser, hasToken} = common(_auth);
            request(app)
                .post('/login')
                .set('Authorization', 'Basic ' + btoa('user:pass'))
                .expect(500)
                .expect((res) => res.body == ERROR_500_RESPONSE)
                .end(done);
        });

    });

    describe('userGetter', () => {

        it('should fail if not set', () => {
            assert.throws(() => auth('secret', null), Error)
        });

        it('should fail on use if set with empty promise', (done) => {
            const _auth = auth('secret', Promise.resolve());
            const {ERROR_500_RESPONSE, app, btoa, hasUserMatchingUser, hasToken} = common(_auth);
            request(app)
                .post('/login')
                .set('Authorization', 'Basic ' + btoa('user:pass'))
                .expect(500)
                .expect((res) => res.body == ERROR_500_RESPONSE)
                .end(done);
        });

        it('should fail on use if set with invalid promise return', (done) => {
            const _auth = auth('secret', Promise.resolve(142));
            const {ERROR_500_RESPONSE, app, btoa, hasUserMatchingUser, hasToken} = common(_auth);
            request(app)
                .post('/login')
                .set('Authorization', 'Basic ' + btoa('user:pass'))
                .expect(500)
                .expect((res) => res.body == ERROR_500_RESPONSE)
                .end(done);
        });

    });

});