const axios = require('axios')
const btoa = require('btoa')
const logger = require('./logger')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/**
 * Oversimplified version of a Routr API Client
 */

const handleError = error => {
  if (error.response.status === 409) {
    throw new Error('ALREADY_EXISTS', error.response.data.message)
  } else if (error.response.status === 401) {
    throw new Error('UNAUTHENTICATED', error.response.data.message)
  } else if (error.response.status === 422) {
    throw new Error('FAILED_PRECONDITION', error.response.data.message)
  } else {
    throw new Error('UNKNOWN')
  }
}

class RoutrClient {
  constructor (apiUrl, username, secret) {
    logger.log('debug', `@yaps/core RoutrClient [creating instance]`)
    logger.log('debug', `@yaps/core RoutrClient [apiUrl: ${apiUrl}]`)
    this.apiUrl = apiUrl
    this.username = username
    this.secret = secret
  }

  async connect () {
    logger.log('debug', `@yaps/core RoutrClient [connecting]`)
    this.token = await this.getToken(this.username, this.secret)
    logger.log('debug', `@yaps/core RoutrClient [token: ${this.token}]`)
  }

  resourceType (resource) {
    this.resource = resource
    return this
  }

  async getToken (username, password) {
    try {
      const response = await axios
        .create({
          baseURL: `${this.apiUrl}/token`,
          headers: { Authorization: `Basic ${btoa(username + ':' + password)}` }
        })
        .get()
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async list (resource) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.resource}?token=${this.token}`
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async get (ref) {
    ref = ref ? `/${ref}` : ''
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async del (ref) {
    ref = ref ? `/${ref}` : ''
    try {
      return await axios.delete(
        `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
      )
    } catch (err) {
      handleError(err)
    }
  }

  async create (data) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.resource}?token=${this.token}`,
        data
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }

  async update (data) {
    try {
      const ref = data.metadata.ref
      const response = await axios.put(
        `${this.apiUrl}/${this.resource}/${ref}?token=${this.token}`,
        data
      )
      return response.data.data
    } catch (err) {
      handleError(err)
    }
  }
}

module.exports = RoutrClient
