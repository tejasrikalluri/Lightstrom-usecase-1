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
          formUpdateBody(resp.ticket.related_tickets.child_ids, event_data);
        } else {
          console.log("its a child ticket")
          formUpdateBody(resp.ticket.related_tickets.parent_id, event_data);
        }
      } else {
        console.log("its a normal ticket")
      }
    } catch (error) {
      console.error(error);
    }
  }
}
function formUpdateBody(ticketIds, updatedObject) {
  var body = {};
  $.each(updatedObject, function (key, value) {
    console.log(key)
    console.log(value)
    if (key === "status")
      body["status"] = value.value;
    else if (key === "priority")
      body["priority"] = value.value;
    else if (key === "urgency")
      body["urgency"] = value.value;
    else if (key === "group_id")
      body["group_id"] = value.value;
    else if (key === "impact")
      body["impact"] = value.value;
    else if (key === "responder_id")
      body["responder_id"] = value.value;
    else if (key === "category")
      body["category"] = value.value;
    else if (key === "department_id")
      body["department_id"] = value.value;
    else if (key === "source")
      body["source"] = value.value;
    else {
      body['custom_fields'][key] = value.value
    }
  });
  console.log(body)
  if ($.isArray(ticketIds)) {
    var count = 0;
    process(count);
  } else {

  }
}
function process(count) {

}

function ticketErrorBlock(error) {
  console.error(error)
}
function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}
