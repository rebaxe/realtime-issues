/**
 * Issues controller.
 *
 * @author Rebecca Axelsson
 * @version 1.0.0
 */

import fetch from 'node-fetch'
import moment from 'moment'

const URL = process.env.API_URL
const TOKEN = process.env.ACCESS_TOKEN

/**
 * Encapsulates a controller.
 */
export class IssuesController {
  /**
   * Renders a view of all issues and sends the rendered HTML string as an HTTP response.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async index (req, res, next) {
    try {
      const gitLabIssues = await fetch(URL, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
      const viewData = {
        issues: gitLabIssues.map(
          issue => ({
            id: issue.iid,
            title: issue.title,
            description: issue.description,
            author: issue.author.name,
            avatar: issue.author.avatar_url,
            updated: moment(issue.updated_at).fromNow(),
            state: issue.state,
            open: false
          })
        ).sort((a, b) => {
          return a.id - b.id
        })
      }
      viewData.issues.forEach(issue => {
        if (issue.state === 'opened') {
          issue.open = true
        }
      })
      res.render('issues/index', { viewData })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Closes an issue.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async close (req, res, next) {
    try {
      await fetch(`${URL}/${req.params.id}?state_event=close`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      res.redirect('..')
    } catch (error) {
      error.status = 404
      next(error)
    }
  }

  /**
   * Reopens an issue.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async reopen (req, res, next) {
    try {
      await fetch(`${URL}/${req.params.id}?state_event=reopen`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      res.redirect('..')
    } catch (error) {
      error.status = 404
      next(error)
    }
  }

  /**
   * Renders a view for creating a new snippet.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  new (req, res) {
    res.render('issues/new')
  }

  /**
   * Renders a view for creating a new issue.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async create (req, res, next) {
    try {
      const newIssue = {
        title: req.body.title,
        description: req.body.description
      }
      const newIssueResponse = await fetch(`${URL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newIssue)
      }).then(res => res.json())

      // Send new issue to all subscribers.
      res.io.emit('issue', {
        id: newIssueResponse.iid,
        title: newIssueResponse.title,
        description: newIssueResponse.description,
        author: newIssueResponse.author.name,
        avatar: newIssueResponse.author.avatar_url,
        updated: moment(newIssueResponse.updated_at).fromNow(),
        state: newIssueResponse.state,
        open: true
      })
      res.redirect('../issues')
    } catch (error) {
      error.status = 404
      next(error)
    }
  }
}
