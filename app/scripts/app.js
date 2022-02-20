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
  client.data.get('ticket').then(function (payload) {
    if (payload.ticket.ticket_type === "Incident") {
      var propertyChangeCallback = function (event) {
        var event_data = event.helper.getData();
        console.log(event_data)
        var updatesFields = [];
        $.each(event_data, function (k, v) {
          updatesFields.push(k);
        });
        mapTicketFieldsTypes(payload.ticket.display_id, updatesFields, payload.ticket.priority, event_data);
      };
    }
    client.events.on("ticket.propertiesUpdated", propertyChangeCallback);
  }).catch(handleErr);
}
function mapTicketFieldsTypes(display_id, updatesFields, priority, event_data) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>" }, options = { headers: headers },
    url = `https://<%= iparam.domain %>/api/v2/ticket_form_fields`, map = new Map(), dropdownMap = {};
  client.request.get(url, options).then(function (data) {
    try {
      tryBlock(data, map, dropdownMap, display_id, updatesFields, priority, event_data);
    } catch (er) {
      console.log("in ticket fields catch block");
      showNotification("error", er);
    }
  }, function (error) {
    parseErrorBlock(error);
  });
}
function tryBlock(data, map, dropdownMap, display_id, updatesFields, priority, event_data) {
  var resp = JSON.parse(data.response);
  $.each(resp.ticket_fields, function (k, v) {
    if (!v.field_type.includes("default")) {
      map[v.name] = v.field_type;
    } if (v.field_type === "custom_multi_select_dropdown") {
      $.each(v.choices, function (k1, v1) {
        dropdownMap[v1.id] = v1.value;
      });
    }
  });
  viewRelatedTickets(display_id, updatesFields, map, dropdownMap, priority, event_data);
}
function viewRelatedTickets(display_id, updatesFields, map, dropdownMap, priority, event_data) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>" };
  var options = { headers: headers };
  var url = `https://<%= iparam.domain %>/api/v2/tickets/${display_id}?include=related_tickets`;
  client.request.get(url, options).then(ticketSuccessBlock, ticketErrorBlock);
  function ticketSuccessBlock(data) {
    try {
      var resp = JSON.parse(data.response);
      console.log(resp.ticket)
      formUpdateBody(display_id, updatesFields, map, dropdownMap, priority, resp, event_data);

    } catch (error) {
      console.error(error);
    }
  }
}
function formUpdateBody(ticketIds, updatesFields, map, dropdownMap, priority, resp, event_data) {
  var body = {
  };
  body['custom_fields'] = {}
  $.each(updatesFields, function (k, v) {
    if (resp.ticket.hasOwnProperty(v)) {
      if (v === "priority" && v !== priority)
        body[v] = resp.ticket[v];
      else if (v === "responder_id" && event_data["responder_id"].value !== "")
        body[v] = resp.ticket[v];
      else if (v !== "priority" && v !== "responder_id")
        body[v] = resp.ticket[v];
    }
    else if (!resp.ticket.hasOwnProperty(v) && resp.ticket.custom_fields.hasOwnProperty(v)) {
      body.custom_fields[v] = resp.ticket.custom_fields[v];
    } else {
      console.log("else")
      console.log(v)
      console.log(event_data[v])
      body[v] = event_data[v].value.split(",");
    }
  });
  console.log(body);
  // if (Object.keys(body).length >= 1) {
  //   if (Object.keys(body.custom_fields).length || Object.keys(body).length > 1) {
  //     if (ticketIds.length > 0) {
  //       var count = 0;
  //       iterate(count, ticketIds, body, "parent", priority);
  //     } else {
  //       iterate(count, ticketIds, body, "child", priority);
  //     }
  //   }

  // }

}

function ticketErrorBlock(error) {
  try {
    var errResp = JSON.stringify(error.response);
    showNotification("error", errResp.message);

  } catch (error) {
    showNotification("error", error);
  }
}
function parseErrorBlock(error) {
  console.log("in ticket fields block");
  try {
    var errResp = JSON.stringify(error.response);
    showNotification("error", errResp.message);

  } catch (error) {
    showNotification("error", error);
  }
}


function showNotification(type, message) {
  console.log(message)
  client.interface.trigger("showNotify", {
    type: type,
    message: message
  });
}

