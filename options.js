// function to load reward settings
function loadRewardSettings() {
  chrome.storage.local.get(['productiveMinutes', 'unproductiveReward'], function(result) {
    if(result.productiveMinutes) {
      document.getElementById('productiveMinutesInput').value = result.productiveMinutes;
    }
    if(result.unproductiveReward) {
      document.getElementById('unproductiveRewardInput').value = result.unproductiveReward;
    }
  });
}

// When reward settings are saved
document.getElementById('saveRewardSettings').addEventListener('click', function() {
  const productiveMinutesValue = document.getElementById('productiveMinutesInput').value;
  const unproductiveRewardValue = document.getElementById('unproductiveRewardInput').value;

  // Function to check if value is a valid whole number
  function isValidWholeNumber(value) {
    // This regex ensures that the string contains only digits (i.e., it's a positive whole number)
    return /^([0-9]+)$/.test(value);
  }

  // Check if either of the fields is empty or not a valid number format
  if (!productiveMinutesValue || !unproductiveRewardValue || !isValidWholeNumber(productiveMinutesValue) || !isValidWholeNumber(unproductiveRewardValue)) {
    alert('Please ensure both fields have valid whole numbers.');
    return;  // Stop here and don't continue with saving
  }

  const productiveMinutes = parseInt(productiveMinutesValue);
  const unproductiveReward = parseInt(unproductiveRewardValue);

  // Check if the values exceed the maximum allowed value of 60
  if (productiveMinutes > 60 || unproductiveReward > 60) {
    alert('Values should not exceed 60.');
    return; // Stop here and don't continue with saving
  }

  chrome.storage.local.set({
    productiveMinutes: productiveMinutes,
    unproductiveReward: unproductiveReward
  }, function() {
    alert('Settings saved!');
  });
});


loadRewardSettings();


function displaySites() {
    // Retrieve and display sites from storage
    chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
        ['unproductive', 'productive'].forEach(type => {
            let listElement = document.getElementById(type + 'List');
            listElement.innerHTML = '';
            for (let site of result[type + 'Sites']) {
                let li = document.createElement('li');

                // Wrap the site name in a span
                let siteNameSpan = document.createElement('span');
                siteNameSpan.className = 'site-name';
                siteNameSpan.textContent = site;
                li.appendChild(siteNameSpan);

                // Create a span element for the "x" with a click event
                let removeSpan = document.createElement('span');
                removeSpan.classList.add('cross-btn');
                removeSpan.style.cursor = 'pointer';
                removeSpan.style.marginLeft = '10px';
                removeSpan.addEventListener('click', function() {
                    removeFromList(site, type);
                });

                li.appendChild(removeSpan);
                listElement.appendChild(li);
            }
        });
    });
}


function removeFromList(siteToRemove, type) {
    chrome.storage.local.get([type + 'Sites'], function(result) {
        let sites = result[type + 'Sites'];
        let index = sites.indexOf(siteToRemove);
        if (index !== -1) {
            sites.splice(index, 1);
            let obj = {};
            obj[type + 'Sites'] = sites;
            chrome.storage.local.set(obj, function() {
                displaySites();
            });
        }
    });
}


function addSite(type) {
    let input = type === 'unproductive' ? document.getElementById('unproductiveInput') : document.getElementById('productiveInput');
    if (input.value.trim() !== '') {
        chrome.storage.local.get([type + 'Sites'], function(result) {
            let sites = result[type + 'Sites'];
            sites.push(input.value.trim());
            let obj = {};
            obj[type + 'Sites'] = sites;
            chrome.storage.local.set(obj, function() {
                input.value = '';
                displaySites();
            });
        });
    }
}

//Initial load
displaySites();


document.getElementById('addUnproductive').addEventListener('click', function() {
    addSite('unproductive');
});


document.getElementById('addProductive').addEventListener('click', function() {
    addSite('productive');
});



// NOTIFICATIONS

// Load notifications
function loadNotifications() {
    chrome.storage.local.get('customNotifications', function(result) {
        const { productive = [], unproductive = [] } = result.customNotifications || {};

        productive.forEach(notification => addNotification('productive', notification));
        unproductive.forEach(notification => addNotification('unproductive', notification));
    });
}

// Add notification
function addNotification(type, notification = {}) {
    const list = document.getElementById(`${type}-notifications-list`);
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `
        <input type="number" class="notification-time" placeholder="Time (minutes)" value="${notification.time || ''}">
        <input type="text" class="notification-message" placeholder="Message" value="${notification.message || ''}">
        <button class="remove-notification">X</button>
    `;
    item.querySelector('.remove-notification').addEventListener('click', function() {
        list.removeChild(item);
    });
    list.appendChild(item);
}

// Save notifications
document.getElementById('saveNotifications').addEventListener('click', function() {
    const productiveNotificationElements = document.querySelectorAll('#productive-notifications-list .notification-item');
    const unproductiveNotificationElements = document.querySelectorAll('#unproductive-notifications-list .notification-item');
    const regex = /^([0-9]+)$/; // To check for valid whole numbers

    const productiveNotifications = [];
    for (let item of productiveNotificationElements) {
        const time = item.querySelector('.notification-time').value;
        const message = item.querySelector('.notification-message').value;
        if (!regex.test(time)) {
            alert('Please ensure all time entries are whole numbers.');
            return; // Stop further execution
        }
        productiveNotifications.push({ time, message });
    }

    const unproductiveNotifications = [];
    for (let item of unproductiveNotificationElements) {
        const time = item.querySelector('.notification-time').value;
        const message = item.querySelector('.notification-message').value;
        if (!regex.test(time)) {
            alert('Please ensure all time entries are whole numbers.');
            return; // Stop further execution
        }
        unproductiveNotifications.push({ time, message });
    }

    chrome.storage.local.set({
        customNotifications: {
            productive: productiveNotifications,
            unproductive: unproductiveNotifications
        }
    }, function() {
        alert('Notification settings saved!');
    });
});

// Event Listeners to add new notifications
document.getElementById('addProductiveNotification').addEventListener('click', () => addNotification('productive'));
document.getElementById('addUnproductiveNotification').addEventListener('click', () => addNotification('unproductive'));

// Initial load
loadNotifications();

