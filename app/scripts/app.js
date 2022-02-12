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
        mapTicketFieldsTypes(payload.ticket.display_id, event_data, payload.ticket.priority);
      };
    }
    client.events.on("ticket.propertiesUpdated", propertyChangeCallback);
  }).catch(handleErr);
}
function viewRelatedTickets(display_id, event_data, map, dropdownMap, priority) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>" };
  var options = { headers: headers };
  var url = `https://<%= iparam.domain %>/api/v2/tickets/${display_id}?include=related_tickets`;
  client.request.get(url, options).then(ticketSuccessBlock, ticketErrorBlock);
  function ticketSuccessBlock(data) {
    try {
      var resp = JSON.parse(data.response);
      if (!$.isEmptyObject(resp.ticket.related_tickets)) {
        if ("child_ids" in resp.ticket.related_tickets) {
          formUpdateBody(resp.ticket.related_tickets.child_ids, event_data, map, dropdownMap, priority);
        } else {
          formUpdateBody(resp.ticket.related_tickets.parent_id, event_data, map, dropdownMap, priority);
        }
      } else {
        console.log("its a normal ticket")
      }
    } catch (error) {
      console.error(error);
    }
  }
}
function formUpdateBody(ticketIds, updatedObject, map, dropdownMap, priority) {
  var body = {
  };
  body['custom_fields'] = {}
  $.each(updatedObject, function (key, value) {
    if (key === "status")
      body["status"] = parseInt(value.value);
    else if (key === "priority" && priority != value.value)
      body["priority"] = parseInt(value.value);
    else if (key === "urgency")
      body["urgency"] = parseInt(value.value);
    else if (key === "group_id")
      body["group_id"] = parseInt(value.value);
    else if (key === "impact")
      body["impact"] = parseInt(value.value);
    else if (key === "responder_id" && value.value !== '') {
      body["responder_id"] = parseInt(value.value);
    }
    else if (key === "category")
      body["category"] = value.value;
    else if (key === "department_id")
      body["department_id"] = parseInt(value.value);
    else if (key === "source")
      body["source"] = parseInt(value.value);
    else if (key === "sub_category")
      body["sub_category"] = value.value;
    else if (key === "item_category")
      body["item_category"] = value.value;
    else if (key === "ticket_type")
      body["type"] = value.value;
    else if (key === "tags")
      body["tags"] = value.value.split(",");
    else {
      if (key !== "priority" && key !== "responder_id" && map[key] !== "custom_date") {
        if (map[key] === "custom_number" || map[key] === "custom_decimal") {
          body.custom_fields[key] = (value.value) ? parseInt(value.value) : null;
        } else {
          body.custom_fields[key] = formCustomMultiSelectBody(map, key, dropdownMap, value);
        }
      }

    }
  });
  console.log(body);
  if (Object.keys(body).length >= 1) {
    if (Object.keys(body.custom_fields).length || Object.keys(body).length > 1) {
      if (ticketIds.length > 0) {
        var count = 0;
        iterate(count, ticketIds, body, "parent", priority);
      } else {
        iterate(count, ticketIds, body, "child", priority);
      }
    }

  }

}
function formCustomMultiSelectBody(map, key, dropdownMap, value) {
  var arr = [];
  if (map[key] === "custom_multi_select_dropdown") {
    $.each(value.value, function (k, v) {
      Object.keys(dropdownMap).forEach(key1 => {
        if (key1 == v) {
          arr.push(dropdownMap[v]);
        }
      });
    });
    return arr;
  } else {
    return value.value;
  }
}
function process(count, arr, body, origin) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>", "Content-Type": "application/json" };
  var options = { headers: headers, body: JSON.stringify(body) };
  var url = (origin === 'child') ? `https://<%= iparam.domain %>/api/v2/tickets/${arr}` :
    `https://<%= iparam.domain %>/api/v2/tickets/${arr[count]}`;
  client.request.put(url, options).then(function () {
    if (origin !== 'child') {
      iterate(count + 1, arr, body, origin);
      console.log(`Updated successfully ticket id- ${arr[count]} `);
    }
    if (count + 1 === arr.length || origin === 'child') {
      showNotification("success", "Ticket(s) updated successfully");
    }
  }, function (error) {
    console.log("in update block");
    try {
      var errResp = JSON.stringify(error.response);
      showNotification("error", errResp.errors);

    } catch (error) {
      showNotification("error", error);
    }
  });
}
function mapTicketFieldsTypes(display_id, event_data, priority) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>" }, options = { headers: headers },
    url = `https://<%= iparam.domain %>/api/v2/ticket_form_fields`, map = new Map(), dropdownMap = {};
  client.request.get(url, options).then(function (data) {
    try {
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
      viewRelatedTickets(display_id, event_data, map, dropdownMap, priority);
    } catch (er) {
      console.log("in ticket fields catch block");
      showNotification("error", er);
    }
  }, function (error) {
    console.log("in ticket fields block");
    try {
      var errResp = JSON.stringify(error.response);
      showNotification("error", errResp.message);

    } catch (error) {
      showNotification("error", error);
    }
  });
}
function iterate(count, ticketIds, body, origin) {
  if (origin === 'child') {
    process(count, ticketIds, body, origin);
  } else {
    if (count < ticketIds.length) {
      process(count, ticketIds, body, origin);
    }
  }

}
function ticketErrorBlock(error) {
  try {
    var errResp = JSON.stringify(error.response);
    showNotification("error", errResp.message);

  } catch (error) {
    showNotification("error", error);
  }
}
function handleErr(err = 'None') {
  showNotification("error", err);
}
function showNotification(type, message) {
  console.log(message)
  client.interface.trigger("showNotify", {
    type: type,
    message: message
  });
}
