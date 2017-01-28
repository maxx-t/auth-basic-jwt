/**
 * Created by max on 26/01/17.
 */

"use strict";

const basicAuth = require('basic-auth');
const tokenAuth = require('./bearer-auth');
const jwt = require('jsonwebtoken');
const parseUrl = require('parseurl');

function unauthorized(res, message = 'Unauthorized') {
    res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
    res.status(401);
    return res.send({message: message});
}

function logout(req, res, next) {

    let url = parseUrl(req);

    //noinspection JSUnresolvedVariable
    if (url.pathname !== '/logout') {
        return next();
    } else {
        req.authenticated = false;
        return res.send({message: 'goodbye'});
    }
}

//noinspection JSUnusedLocalSymbols
function anyLevel(req, res, next) {
    if (!req.authenticated) {
        req.authenticated = false;
        req.user = {name: 'anonymous'};
    }
    next();
}

function userLevel(req, res, next) {
    if (!req.authenticated) return unauthorized(res);
    else next();
}

function adminLevel(req, res, next) {
    if (!req.authenticated || !req.user.admin) return unauthorized(res);
    else next();
}

/**
 * @param secret
 * @param userInterface
 * @param options
 * @return {{any: anyLevel, user: userLevel, admin: adminLevel, core: [logout, authBasic, login, authJWT, anyLevel]}}
 */
module.exports = (secret, userInterface, options) => {
    if (!secret) throw new Error("No secret set");
    if (!userInterface) throw new Error("No userInterface set");
    if (!options) options = {};
    if (!options.token) options.token = {};

    /**
     * Return jwt token if matches /login (POST)
     */
    function login(req, res, next) {

        let url = parseUrl(req);

        //noinspection JSUnresolvedVariable
        if (url.pathname == '/login' && req.method == 'POST') {
            if (req.authenticated) {
                jwt.sign({
                    user: req.user,
                    exp: options.token.exp,//expiration date
                    iss: options.token.iss,
                    //sub: options.token.sub,//user id
                    aud: options.token.aud //client id
                }, secret, {}, (err, token) => {
                    if (err) {
                        err.type = 'jwt';
                        return next(err);
                    }
                    return res.json({
                        user: req.user,
                        token: token
                    })
                })
            }
            else return unauthorized(res, 'Bad user or Password');
        }
        else return next();

    }

    //noinspection JSUnusedLocalSymbols
    function authBasic(req, res, next) {

        //if previous auth succeed
        if (req.authenticated) return next();

        let basic = basicAuth(req);

        //if basicAuth attempted
        if (basic && basic.name && basic.pass) {
            let user = userInterface.get(basic.name);
            if (user && basic.pass === user.pass) {
                req.authenticated = true;
                delete user.pass; //hiding user pass in response
                req.user = user;
            } else {
                req.authenticated = false;
                return unauthorized(res, 'Bad user or Password');
            }
        }

        return next();
    }

    //noinspection JSUnusedLocalSymbols
    function authJWT(req, res, next) {
        //if previous auth succeed
        if (req.authenticated) return next();

        let token = tokenAuth(req);

        //else if JWT auth attempted
        if (token) {
            // for errors see:
            // https://github.com/auth0/node-jsonwebtoken#jsonwebtokenerror
            // https://github.com/auth0/node-jsonwebtoken#tokenexpirederror
            jwt.verify(token, secret, function (err, decoded) {
                if (err) return unauthorized(res, err.message || 'jwt error');
                else {
                    req.authenticated = true;
                    req.user = decoded.user;
                }
                return next();
            });
        }
        else return next();
    }

    return {
        any: anyLevel,
        user: userLevel,
        admin: adminLevel,
        core: [logout, authBasic, login, authJWT, anyLevel]
    };
};
