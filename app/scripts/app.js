document.onreadystatechange = function () {
  if (document.readyState === 'interactive') renderApp();

  function renderApp() {
    var onInit = app.initialized();

    onInit
      .then(function getClient(_client) {
        window.client = _client;
        renderTicketPage();
      })
      .catch(handleErr);
  }
};

function renderTicketPage() {
  console.log("IIIIIIIIIIIIIIIIIIIIIIIIIIIIII")
  client.data
    .get('ticket')
    .then(function (payload) {
      console.log(payload.ticket.display_id)
      var propertyChangeCallback = function (event) {
        console.log("**************************")
        var event_data = event.helper.getData();
        console.log(event_data)
        viewRelatedTickets(payload.ticket.display_id, event_data);
      };
      client.events.on("ticket.propertiesUpdated", propertyChangeCallback);
    })
    .catch(handleErr);
}
function viewRelatedTickets(display_id, event_data) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>" };
  var options = { headers: headers };
  var url = `https://<%= iparam.domain %>/api/v2/tickets/${display_id}?include=related_tickets`;
  client.request.get(url, options).then(ticketSuccessBlock, ticketErrorBlock);
  function ticketSuccessBlock(data) {
    try {
      var resp = JSON.parse(data.response);
      console.log(resp)
      if (!$.isEmptyObject(resp.ticket.related_tickets)) {
        if ("child_ids" in resp.ticket.related_tickets) {
          console.log("its a parent ticket")
        } else {
          console.log("its a child ticket")
        }
      } else {
        console.log("its a normal ticket")
      }
    } catch (error) {
      console.error(error);
    }
  }
}

function ticketErrorBlock(error) {
  console.error(error)
}
function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}
