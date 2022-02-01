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
      console.log(payload.ticket)
      if (payload.ticket.ticket_type === "Incident") {
        var propertyChangeCallback = function (event) {
          console.log("**************************")
          var event_data = event.helper.getData();
          console.log(event_data)
          viewRelatedTickets(payload.ticket.display_id, event_data);
        };
      }

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
  var body = {
    "custom_fields": {}
  };
  $.each(updatedObject, function (key, value) {
    console.log(key)
    console.log(value)
    if (key === "status")
      body["status"] = parseInt(value.value);
    else if (key === "priority")
      body["priority"] = parseInt(value.value);
    else if (key === "urgency")
      body["urgency"] = parseInt(value.value);
    else if (key === "group_id")
      body["group_id"] = value.value;
    else if (key === "impact")
      body["impact"] = parseInt(value.value);
    else if (key === "responder_id")
      body["responder_id"] = value.value;
    else if (key === "category")
      body["category"] = value.value;
    else if (key === "department_id")
      body["department_id"] = value.value;
    else if (key === "source")
      body["source"] = parseInt(value.value);
    else if (key === "sub_category")
      body["sub_category"] = value.value;
    else if (key === "item_category")
      body["item_category"] = value.value;
    else if (key === "ticket_type")
      body["ticket_type"] = value.value;
    else if (key === "tags")
      body["tags"] = value.value;
    else {
      body.custom_fields[key] = value.value;
    }
  });
  console.log(body)
  if ($.isArray(ticketIds)) {
    var count = 0;
    iterate(count, ticketIds, body);
  } else {
    iterate(count, ticketIds.length, ticketIds, body, null);
  }
}
function process(count, arr, body, origin) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>", "Content-Type": "application/json" };
  var options = { headers: headers, body: JSON.stringify(body) };
  var url = `https://<%= iparam.domain %>/api/v2/tickets/${arr[count]}`;
  client.request.put(url, options).then(function () {
    console.log(`Updated successfully ticket id- ${arr[count]}`);
    if (origin !== null)
      iterate(count + 1, arr, body);
  }, function (error) {
    console.log("in update block");
    console.error(error);
  });
}
function iterate(count, ticketIds, body) {
  if (count < ticketIds.length) {
    process(count, ticketIds, body, "loop");
  }
}
function ticketErrorBlock(error) {
  console.error(error)
}
function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}
