var chai = require('chai')
  , expect = chai.expect
  , request = require('request')
  , server
  , baseurl
  , secureBaseurl
  , SSLRequiredErrorText
  , validHeader
  , invalidHeader
  ;

before(function () {
  server = require('./server')({ httpPort: 8087, httpsPort: 7443 });
  baseurl = 'http://localhost:' + server.port;
  secureBaseurl = 'https://localhost:' + server.securePort;
  SSLRequiredErrorText = 'SSL Required.';

  validHeader = {
    'X-Forwarded-Proto': 'https'
  };

  invalidHeader = {
    'X-Forwarded-Proto': 'WrongProtocol'
  };
});

describe('Test HTTPS behavior when X-Forwarded-Proto header exists but is not trusted.', function(){
  it('Should not be redirected to SSL on non "SSL Only" endpoint.', function(done){
    request.get({
      url: baseurl,
      followRedirect: false,
      strictSSL: false,
      headers: validHeader
    }, function (error, response){
      //noinspection BadExpressionStatementJS
      expect(error).to.not.exist;
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('Should be redirected to SSL on "SSL Only" endpoint with valid but untrusted X-Forwarded-Proto Header.',
    function(done){
      var destination = baseurl + '/ssl';
      request.get({
        url: destination,
        followRedirect: false,
        strictSSL: false,
        headers: validHeader
    }, function (error, response){
      //noinspection BadExpressionStatementJS
      expect(error).to.not.exist;
      expect(response.statusCode).to.equal(301);
      done();
    });
  });

  it('Should be redirect to SSL on "SSL Only" endpoint with invalid untrusted X-Forwarded-Proto Header.',
    function(done){
      var originalDestination = baseurl + '/ssl';
      var expectedDestination = secureBaseurl + '/ssl';

      request.get({
        url: originalDestination,
        followRedirect: false,
        strictSSL: false,
        headers: invalidHeader
    }, function (error, response){
      //noinspection BadExpressionStatementJS
      expect(error).to.not.exist;
      expect(response.statusCode).to.equal(301);
      expect(response.headers.location).to.equal(expectedDestination);
      done();
    });
  });

  it('Should be redirected to expected destination on "SSL Only" endpoint with invalid untrusted X-Forwarded-Proto ' +
  'Header.', function(done){
    var originalDestination = baseurl + '/ssl';
    var expectedDestination = secureBaseurl + '/ssl';

    request.get({
      url: originalDestination,
      followRedirect: true,
      strictSSL: false,
      headers: invalidHeader
    }, function (error, response){
      //noinspection BadExpressionStatementJS
      expect(error).to.not.exist;
      expect(response.statusCode).to.equal(200);
      expect(response.request.uri.href).to.equal(expectedDestination);
      done();
    });
  });

  it('Should receive 403 error when POSTing data to "SSL Only" endpoint with untrusted X-Forwarded-Proto Header.',
    function(done){
      var destination = baseurl + '/sslEcho';
      var postData = { key1: 'Keyboard.', key2: 'Cat.'};
      request.post({
        url: destination,
        followRedirect: true,
        strictSSL: false,
        form: postData,
        headers: validHeader
    }, function(error, response, body){
      //noinspection BadExpressionStatementJS
      expect(error).to.not.exist;
      expect(response.statusCode).to.equal(403);
      expect(response.request.uri.href).to.equal(destination);
      expect(body).to.equal(SSLRequiredErrorText);
      done();
    });
  });

  it('Should receive 403 error when POSTing data to "SSL Only" endpoint with untrusted invalid X-Forwarded-Proto ' +
  'Header.', function(done){
    var destination = baseurl + '/sslEcho';
    var postData = { key1: 'Keyboard.', key2: 'Cat.'};
    request.post({
      url: destination,
      followRedirect: true,
      strictSSL: false,
      form: postData,
      headers: invalidHeader
    }, function(error, response, body){
      //noinspection BadExpressionStatementJS
      expect(error).to.not.exist;
      expect(response.statusCode).to.equal(403);
      expect(response.request.uri.href).to.equal(destination);
      expect(body).to.equal(SSLRequiredErrorText);
      done();
    });
  });

});