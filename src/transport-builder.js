import TransportHandler from './transport-handler'

/**
 * Create explicit dialog window transport.
 * @param {String} frontendUrl - URL of the Albedo frontend.
 * @return {TransportHandler}
 */
function createDialogTransport(frontendUrl) {
    const container = document.createElement('div')
    container.className = 'albedo-dialog-container'
    container.innerHTML = `
<div class="albedo-dialog-background" role="close"></div>
<a href="#" class="albedo-dialog-close" role="close" title="Close">✕</a>
<iframe src="${frontendUrl}/confirm"  class="albedo-dialog-frame" width="440" height="600" referrerpolicy="origin"/>
`
    document.body.appendChild(container)

    const iframe = container.querySelector('iframe')
    const dialogIframeTransport = new TransportHandler(iframe.contentWindow, true)

    function close() {
        document.body.removeChild(container)
        dialogIframeTransport.transportCloseHandler()
    }

    for (const el of container.querySelectorAll('[role=close]')) {
        el.addEventListener('click', close, false)
    }
    dialogIframeTransport.onResponseReceived = close

    return dialogIframeTransport.onLoaded
}

let sharedIframeTransport = null

/**
 * Create implicit transport based on hidden iframe.
 * @param {String} frontendUrl - URL of the Albedo frontend.
 * @return {TransportHandler}
 */
function createIframeTransport(frontendUrl) {
    //check if already initialized
    if (!sharedIframeTransport) {
        const iframe = document.createElement('iframe')
        iframe.style.border = 'none'
        Object.assign(iframe, {
            width: '0',
            height: '0',
            frameBorder: '0',
            referrerPolicy: 'origin',
            src: `${frontendUrl}`
        })
        document.body.appendChild(iframe)
        sharedIframeTransport = new TransportHandler(iframe.contentWindow)
    }
    return sharedIframeTransport.onLoaded
}

export {createDialogTransport, createIframeTransport}