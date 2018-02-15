/********************************************
 * ACMで管理している証明書のARNを取得するFunction
 ********************************************/

const aws = require('aws-sdk')

exports.handler = (event, context) => {

  console.log('REQUEST RECEIVED:\n' + JSON.stringify(event))

  // CreateとDeleteのリクエストが発生する
  if (event.RequestType === 'Delete') {
    sendResponse(event, context, 'SUCCESS')
    return
  }

  // CloudFormationから受け取る引数
  const region = event.ResourceProperties.Region
  const domainName = event.ResourceProperties.DomainName

  // 対象サービス(ACM)用のインスタンス生成
  const acm = new aws.ACM({region})
  
  // 管理している証明書の情報を取得し、リクエストに該当したもののARNを返却する
  acm.listCertificates({}, (err, data) => {
    if (err) {
       console.log(err, err.stack)
       const responseData = { Error: 'acm#listCertificates call failed' }
       sendResponse(event, context, 'FAILED', responseData)
       return
    } 

    console.log('RESULT acm#listCertificates:\n' + data)
    const cert = findByDomainName(data, domainName)
    if (!cert) {
      const responseData = { Error: 'Certificate not found' }
      sendResponse(event, context, 'FAILED', responseData)
      return
    }

    sendResponse(event, context, 'SUCCESS', cert)
  });
}

/**
 * 該当する証明書が見つかった場合は先頭のものを返却.
 * 見つからなかった場合はnullを返却する.
 */
function findByDomainName(data, name) {
  const found = data.CertificateSummaryList.filter(cert => {
    return cert.DomainName === name
  })

  return found? found[0] : null
}


/**
 * CloudWatchへログを出力し、結果を返却する
 */
function sendResponse(event, context, responseStatus, responseData) {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason:
      'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  })

  console.log('RESPONSE BODY:\n', responseBody)

  const https = require('https')
  const url = require('url')

  const parsedUrl = url.parse(event.ResponseURL)
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  }

  console.log('SENDING RESPONSE...\n')

  const request = https.request(options, function(response) {
    console.log('STATUS: ' + response.statusCode)
    console.log('HEADERS: ' + JSON.stringify(response.headers))
    context.done()
  })

  request.on('error', function(error) {
    console.log('sendResponse Error:' + error)
    context.done()
  })

  // write data to request body
  request.write(responseBody)
  request.end()
}
