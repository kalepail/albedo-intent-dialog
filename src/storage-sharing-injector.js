if (window.parent !== window) { //we are inside an iframe
    //message dispatcher func
    function dispatch(method, req) {
        return new Promise((resolve) => {
            const reqKey = new Date().getTime() + Math.floor(Math.random() * 17179869180).toString(36)

            function listener(event) {
                //math requests by a unique request key to deal with concurrent requests
                if (event.data.reqKey === reqKey) {
                    resolve(event.data.response)
                    //unbind the listener once we received the response
                    window.removeEventListener('message', listener, false)
                }
            }

            //pass the request to the parent frame
            window.parent.postMessage({
                type: 'shared-storage',
                method,
                reqKey,
                req
            }, '*')
            //listen for the parent window responses
            window.addEventListener('message', listener, false)
        })
    }

    window.albedoStorageProvider = {
        /**
         * Load an item from the storage by its key
         * @param {String} key
         * @return {Promise<String>}
         */
        getItem(key) {
            return dispatch('getItem', {key})
                .then(response => response.value)
        },
        /**
         * Save and item to the storage
         * @param {String} key
         * @param {String} value
         * @return {Promise<void>}
         */
        setItem(key, value) {
            return dispatch('setItem', {key, value})
        },
        /**
         * Remove an item from the storage by its key
         * @param {String} key
         * @return {Promise<void>}
         */
        removeItem(key) {
            return dispatch('removeItem', {key})
        },
        /**
         * List all storage keys
         * @return {Promise<Array<String>>}
         */
        enumerateKeys() {
            return dispatch('enumerateKeys', {})
                .then(response => response.keys)
        }
    }
} else {
    const allowedOrigin = 'https://albedo.link'
    window.addEventListener('message', async (event) => {
        const {data, origin, source} = event
        //allow only specific calls from a trusted origin, ignore all other calls
        if (data.type !== 'shared-storage' || origin !== allowedOrigin) return

        function dispatch(response) {
            source.postMessage({...data, response}, origin)
        }

        const {req} = data
        switch (data.method) {
            case 'getItem': {
                const {value} = await Storage.get({key: req.key})
                return dispatch({value})
            }

            case 'setItem': {
                await Storage.set({key: req.key, value: req.value})
                return dispatch({})
            }

            case 'removeItem': {
                await Storage.remove({key: req.key})
                return dispatch({})
            }

            case 'enumerateKeys': {
                const {keys} = await Storage.keys()
                return dispatch({keys})
            }
        }
    }, false)
}