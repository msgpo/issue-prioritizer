const _ = require('lodash');
const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const { paginateRest } = require("@octokit/plugin-paginate-rest");

const token = core.getInput("token");
const column_id = parseInt(core.getInput("column_id"));
const order = core.getInput("order").split(',');

const GitHub = Octokit.plugin(paginateRest);
const client = new GitHub({
  auth: token,
  previews: ["inertia"]
});

async function performRequest({path, inputs}, paginate = false) {
  return await (paginate ? client.paginate(path, inputs) : client.request(path, inputs));
}

function getCards() {
  core.info(`Getting project cards for column ${column_id}...`);
  return performRequest({
    path: "GET /projects/columns/{column_id}/cards",
    inputs: {
      column_id,
      archived_state: 'all',
      per_page: 100,
      page: 1,
    }
  }, true);
}

function moveCard(cards, index) {
  core.debug(`Moving card with id ${cards[index].id}`);
  performRequest({
    path: `POST /projects/columns/cards/{card_id}/moves`,
    inputs: {
      card_id: cards[index].id,
      position: 'bottom',
      column_id,
    }
  }).then(_ => {
    if (index + 1 < cards.length) {
      moveCard(cards, index + 1);
    } else {
      core.info("Done.");
    }
  }).catch(error => {
    core.setFailed(`Couldn't move card with id ${cards[index].id}: ${error.message}`);
  });
}

function sortCardLabels(labels) {
  return _.sortBy(labels, label => {
    const index = order.indexOf(label);
    if (index >= 0) {
      return index;
    }
    return labels.length;
  });
}

function sortCards(cards) {
  return _.sortBy(cards, card => {
    if (card.labels.length > 0) {
      const sortedLabels = sortCardLabels(card.labels);
      const index = order.indexOf(sortedLabels[0]);
      if (index >= 0) {
        return index;
      }
      return order.length;
    } else {
      return order.length;
    }
  });
}

function rearrangeCards() {
  getCards().then(result => {
    const promises = result.filter(card => {
      // TODO: what happens to these cards?
      return card['content_url'] != null;
    }).map(card => {
      core.debug(`GET ${card['content_url'].replace('https://api.github.com', '')}`);
      return performRequest({
        path: `GET ${card['content_url'].replace('https://api.github.com', '')}`,
      }).then(issue => {
        card.labels = issue['data']['labels'].map(label => label.name);
        return card;
      }).catch(error => {
        core.info(error);
      });
    });

    return Promise.all(promises).then(cards => {
      core.info(`Sorting ${cards.length} cards...`);
      moveCard(sortCards(cards), 0);
    });
  }).catch(error => {
    core.setFailed(error.message);
  });
}

rearrangeCards();
