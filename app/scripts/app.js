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
  client.data.get('ticket').then(function (payload) {
    if (payload.ticket.ticket_type === "Incident") {
      var propertyChangeCallback = function (event) {
        var event_data = event.helper.getData();
        console.log(event_data)
        mapTicketFieldsTypes(payload.ticket.display_id, event_data);
      };
    }
    client.events.on("ticket.propertiesUpdated", propertyChangeCallback);
  }).catch(handleErr);
}
function viewRelatedTickets(display_id, event_data, map, dropdownMap) {
  var headers = { "Authorization": "Basic <%= encode(iparam.apikey) %>" };
  var options = { headers: headers };
  var url = `https://<%= iparam.domain %>/api/v2/tickets/${display_id}?include=related_tickets`;
  client.request.get(url, options).then(ticketSuccessBlock, ticketErrorBlock);
  function ticketSuccessBlock(data) {
    try {
      var resp = JSON.parse(data.response);
      if (!$.isEmptyObject(resp.ticket.related_tickets)) {
        if ("child_ids" in resp.ticket.related_tickets) {
          console.log("its a parent ticket")
          formUpdateBody(resp.ticket.related_tickets.child_ids, event_data, map, dropdownMap);
        } else {
          console.log("its a child ticket")
          formUpdateBody(resp.ticket.related_tickets.parent_id, event_data, map, dropdownMap);
        }
      } else {
        console.log("its a normal ticket")
      }
    } catch (error) {
      console.error(error);
    }
  }
}
function formUpdateBody(ticketIds, updatedObject, map, dropdownMap) {
  var body = {
    "custom_fields": {}
  };
  $.each(updatedObject, function (key, value) {
    if (key === "status")
      body["status"] = parseInt(value.value);
    else if (key === "priority")
      body["priority"] = parseInt(value.value);
    else if (key === "urgency")
      body["urgency"] = parseInt(value.value);
    else if (key === "group_id")
      body["group_id"] = parseInt(value.value);
    else if (key === "impact")
      body["impact"] = parseInt(value.value);
    else if (key === "responder_id")
      body["responder_id"] = parseInt(value.value);
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
      body.custom_fields[key] = (map[key] === "custom_number") ? parseInt(value.value) :
        formCustomMultiSelectBody(map, key, dropdownMap, value);
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
function mapTicketFieldsTypes(display_id, event_data) {
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
      viewRelatedTickets(display_id, event_data, map, dropdownMap);
    } catch (er) {
      console.log("in ticket fieldscatch block");
      console.error(er)
    }
  }, function (error) {
    console.log("in ticket fields block");
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
