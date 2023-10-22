// FOR OVERALL TIMER
let timeAllowed = 30*60 //this replaces 1 mins (initial time allowed and this is in seconds)

//also save this to local storage
chrome.storage.local.set({ timeAllowed: timeAllowed })

let customNotifications = {};

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
        if (!result.unproductiveSites || !result.productiveSites) {
            const defaultUnproductive = ['reddit.com', 'discord.com', 'instagram.com'];
            const defaultProductive = ['google.com', 'classroom.google.com', 'nzqa.govt.nz', 'www.notion.so', 'gmail.com', 'chat.openai.com', 'drive.google.com', 'docs.google.com', 'https://www.google.com/search?q=periodic+table&oq=per&aqs=chrome.0.69i59j69i57j69i59l2j69i60l4.1345j0j1&sourceid=chrome&ie=UTF-8&safe=active&ssui=on']

            chrome.storage.local.set({
                unproductiveSites: defaultUnproductive,
                productiveSites: defaultProductive
            });
        }
    });
});


// Load custom notifications from local storage when the background script initializes.
chrome.storage.local.get('customNotifications', function(result) {
    if (result.customNotifications) {
        customNotifications = result.customNotifications;
    }
});



chrome.storage.local.get(null, function(result) {
    console.log(result);
});

// For resetting timer
// gets time and checks if it's the right time to reset
function getCurrentTime() {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Log a message for debugging purposes
    console.log("just ran");

    // Check if it's 9:03:00 PM
    if (hours == 00 && minutes == 00 && seconds == 00) {
        resetTimers();
    }

    //Formatted time
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function resetTimers() {
    console.log("Timer reset!");

    // For productive timer
    timeAllowed = 30*60
    startTime = 0
    chrome.storage.local.set({ elapsedTime: Math.floor(Date.now() / 1000) });
    // const elapsedTime = 0?

    // For unproductive timer
    // remainingTime2 = 30?
    const now = new Date().getTime();
    const thirtyMinutesLater = new Date(now + timeAllowed * 1000).getTime();
    chrome.storage.local.set({
        totalTimeSpent2: 0,
        targetDate2: thirtyMinutesLater,
        startTime2: now,
        paused2: true, // Set the paused state to false initially
        remainingTime2: 0, // Set the remainingTime to 0 initially
        minutes2: 30, // Set initial value for minutes
        seconds2: 0, // Set initial value for seconds
        isPaused: true,
        paused2: true,
    });


    // address pause variables to determine whether to pause timers
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
            const unproductiveSites = result.unproductiveSites;
            const productiveSites = result.productiveSites;

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                    const isUnproductiveSite = unproductiveSites.some(url => tabs[0].url.includes(url));
                    const isProductiveSite = productiveSites.some(url => tabs[0].url.includes(url));

                    if (isProductiveSite) {
                      chrome.storage.local.set({ isPaused: false }, () => {
                        console.log("Timer started on extension load for productive site");
                      });
                    }
                    else if (isUnproductiveSite) {
                      // If site is unproductive, pause the productive timer and resume the unproductive timer
                      chrome.storage.local.set({ pausedTime: Date.now() / 1000, isPaused: true }, () => {
                        console.log("Timer paused on unproductive site");
                      });

                      chrome.storage.local.set({ paused2: false }, () => {
                        console.log("Unproductive timer resumed on unproductive site");
                      });
                    }
                    else {
                      // If site is neutral
                      chrome.storage.local.set({ pausedTime: Date.now() / 1000, isPaused: true }, () => {
                        console.log("Timer paused on neutral site");
                      });
                    }
                }
            });
        });
      }
    });
}

// Check time every second
var checkTime = setInterval(getCurrentTime, 1000);






// FOR PRODUCTIVE TIMER
//---------------------
// store the starting time of the timer. It represents the time when the timer starts counting.
let intervalId;
let startTime = 0;

// Initialize elapsedTime when extension is first loaded
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ elapsedTime: Math.floor(Date.now() / 1000) });
  chrome.storage.local.get(['elapsedTime'], function(result) {
    let elapsedTime = result.elapsedTime
    console.log("ELAPSED TIME IS " + elapsedTime)
  })

});

function startInterval() {
  if (intervalId) {
    clearInterval(intervalId);  // Clear existing interval
  }
  intervalId = setInterval(updateTimer, 1000);  // Start a new interval
}

// function for updating the timer
function updateTimer() {
  // Handle productive timer
  chrome.storage.local.get(['isPaused', 'elapsedTime'], (result) => {
    const isPaused = result.isPaused || false;
    const elapsedTime = result.elapsedTime || 0;  // This now stores the total 'productive' time

    if (!isPaused) {
        const currentTime = Math.floor(Date.now() / 1000);
        const displayedTime = currentTime - elapsedTime;
        chrome.action.setBadgeText({ text: formatTime(displayedTime) });

        let secs = Math.floor(displayedTime);
        chrome.storage.local.set({ timeSpentOnProductive: secs });

        // Check and send custom notification for productive sites
        checkAndSendCustomNotification('productive', secs);
    }
  });

  // Handle unproductive time and notifications
  chrome.storage.local.get(['timeSpentOnProductive', 'totalTimeSpent2', 'seconds2', 'minutes2', 'timeRemaining2'], function(result) {
    const timeRemaining2 = result.timeRemaining2
    checkAndSendCustomNotification('unproductive', Math.floor(timeRemaining2/1000));

    if (result.timeSpentOnProductive && result.totalTimeSpent2) {
      const timeSpentOnProductive = result.timeSpentOnProductive;
      const totalTimeSpent2 = result.totalTimeSpent2;
      const seconds2 = result.seconds2;
      const minutes2 = result.minutes2;

      chrome.storage.local.get(['productiveMinutes', 'unproductiveReward'], function(settings) {
        // Convert minutes to seconds
        const productiveInterval = (settings.productiveMinutes || 10) * 60; // default to 10 minutes if not set
        const unproductiveReward = (settings.unproductiveReward * 60) || 60;   // default to 60 seconds if not set

        if (timeSpentOnProductive % productiveInterval === 0) {
            const newTimeAllowed = unproductiveReward + (1800 - totalTimeSpent2);

            console.log("NEW TIME ADDED")

            console.log("timer should be incrementing now")
            // Reset timer_expired because more time has been added
            chrome.storage.local.set({ timer_expired: false });

            // Update timeAllowed in storage
            chrome.storage.local.set({ timeAllowed: newTimeAllowed });
            console.log("seconds 2 is " + seconds2)
            console.log("minutes2 2 is " + minutes2)
            console.log("newTimeAllowed is " + newTimeAllowed)

            // Update targetDate2 for unproductive timer
            const newNow = new Date().getTime();
            const newTargetDate = new Date(newNow + (newTimeAllowed * 1000)).getTime();
            chrome.storage.local.set({ targetDate2: newTargetDate });

            // Update the display in the popup
            updateTimerDisplay2(newTimeAllowed * 1000);

            updateTimer2();
            clearInterval(timerInterval2);
            timerInterval2 = setInterval(updateTimer2, 1000);
        }
      })
    }
  })



  function checkAndSendCustomNotification(type, timeSpentInSeconds) {
    if (customNotifications[type]) {
        customNotifications[type].forEach(notif => {
            // Ensure that notif.time is in seconds for comparison
            if (notif.time * 60 == timeSpentInSeconds) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'FocusFlow48.png',
                    title: 'Focus Flow',
                    message: notif.message
                });
            }
        });
    }
  }

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.customNotifications) {
        customNotifications = changes.customNotifications.newValue;
    }
  });

}




// helper function that takes the total number of seconds as input and converts it into a formatted string representing the time in the format HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  var notifOptions = {
        type: 'basic',
        iconUrl: 'FocusFlow48.png',
        title: '30 mins done!!!',
        message: "Keep Studying!!"
    };
    var notificationId = 'limitNotif' + Math.random(); // Append random number to the notification ID
    var roundedSeconds = Math.floor(seconds);
    if (roundedSeconds == 1800) {
        chrome.notifications.create(notificationId, notifOptions);
    }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  chrome.storage.local.get(['productiveWorkMsg', 'unproductiveWarningMsg'], function(result) {
    const productiveWorkMsg = result.productiveWorkMsg || "10 mins of work done! keep going!!!"; // default message if not set
    const unproductiveWarningMsg = result.unproductiveWarningMsg || "1 minute of unproductive time left!! maybe it's time to do some work!"; // default message if not set

    if (conditionForProductiveWork) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png', // your extension's icon
            title: 'Work Update',
            message: productiveWorkMsg
        });
    }

    if (conditionForUnproductiveWarning) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png', // your extension's icon
            title: 'Time Warning',
            message: unproductiveWarningMsg
        });
    }
  });
}


// ensures that the timer is updated every second while the extension is active
startInterval();

// this event is triggered when a tab is activated (switched to)
chrome.tabs.onActivated.addListener((activeInfo) => {
  //fetches information about the newly activated tab
  tabChange(activeInfo);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    tabChange({tabId: tab.id});
  }
});

// handle initialization so that timer doesn’t start running when extension is first loaded
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs[0]) {
    chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
        const unproductiveSites = result.unproductiveSites;
        const productiveSites = result.productiveSites;

        // Use unproductiveSites and productiveSites in your logic:
        // Example:
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {

                const unproductiveSites = result.unproductiveSites || [];
                const productiveSites = result.productiveSites || [];

                console.log("Unproductive Sites:", unproductiveSites);
                console.log("Productive Sites:", productiveSites);

                const isUnproductiveSite = unproductiveSites.some(url => tabs[0].url.includes(url));
                const isProductiveSite = productiveSites.some(url => tabs[0].url.includes(url));



                if (isUnproductiveSite || !isProductiveSite) {
                  chrome.storage.local.set({ pausedTime: Date.now() / 1000, isPaused: true }, () => {
                    console.log("Timer paused on extension load");
                  });
                } else if (isProductiveSite) {
                  chrome.storage.local.set({ isPaused: false }, () => {
                    console.log("Timer started on extension load");
                  });
                }
            }
        });
    });
  }
});


function tabChange (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
        const unproductiveSites = result.unproductiveSites;
        const productiveSites = result.productiveSites;

        // Use unproductiveSites and productiveSites in your logic:
        // Example:
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                const isUnproductiveSite = unproductiveSites.some(url => tabs[0].url.includes(url));
                const isProductiveSite = productiveSites.some(url => tabs[0].url.includes(url));

                // ... Rest of your logic using these checks
                chrome.storage.local.set({ isRedditTab: isUnproductiveSite, isProductiveSite: isProductiveSite });

                chrome.storage.local.get(['isPaused', 'pausedTime', 'elapsedTime'], (result) => {
                  const isPaused = result.isPaused || false;
                  const pausedTime = result.pausedTime || 0;
                  const previousElapsedTime = result.elapsedTime || 0;

                  if (isUnproductiveSite || !isProductiveSite) {
                    // Pause the timer only if it's not already paused
                    if (!isPaused) {
                      chrome.storage.local.set({ pausedTime: Date.now() / 1000, isPaused: true }, () => {
                        console.log("Timer paused on unproductive or neutral site");
                      });
                    }
                  } else if (isProductiveSite && isPaused) {
                    // Resume the timer
                    const pauseDuration = Math.floor(Date.now() / 1000) - pausedTime;
                    const newStartTime = previousElapsedTime + pauseDuration;
                    chrome.storage.local.set({ elapsedTime: newStartTime, isPaused: false }, () => {
                      console.log("Timer resumed on productive site");
                    });
                  }
                });
            }
        });
    });
  });
}


// Variables to track focus state and timestamps
let isWindowFocused = true;
let windowLostFocusTime = 0;
let windowRegainedFocusTime = 0;

chrome.windows.onFocusChanged.addListener((windowId) => {
    chrome.storage.local.get(['isRedditTab', 'isProductiveSite', 'elapsedTime', 'isPaused'], (result) => {
        const isUnproductiveSite = result.isRedditTab || false;
        const isProductiveSite = result.isProductiveSite || false;
        const elapsedTime = result.elapsedTime || 0;
        const isPaused = result.isPaused || false;

        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            // Window lost focus
            isWindowFocused = false;
            windowLostFocusTime = Date.now() / 1000;

            // If on a productive site and the timer is not paused, pause it
            if (isProductiveSite && !isPaused) {
                chrome.storage.local.set({ pausedTime: windowLostFocusTime, isPaused: true }, () => {
                    console.log("Timer paused due to window minimization");
                });
            }

        } else {
            // Window regained focus
            isWindowFocused = true;
            windowRegainedFocusTime = Date.now() / 1000;

            // Check if the reset time was reached during the window's minimized state
            const resetOccurredDuringMinimization = didResetTimeOccur(windowLostFocusTime, windowRegainedFocusTime);
            console.log("resetOccurredDuringMinimization value is " + resetOccurredDuringMinimization)

            if (resetOccurredDuringMinimization) {
                console.log("reset from focus function")
                resetTimers();
            } else if (isProductiveSite && isPaused) {
                const minimizedDuration = windowRegainedFocusTime - windowLostFocusTime;
                const newElapsedTime = elapsedTime + minimizedDuration;
                chrome.storage.local.set({ elapsedTime: newElapsedTime, isPaused: false }, () => {
                    console.log("Timer resumed after window refocused");
                });
            }
        }
    });
});

function didResetTimeOccur(startTime, endTime) {
    const resetHour = 00;
    const resetMinute = 00;
    const resetSecond = 00;

    const resetTimeInSeconds = (resetHour * 60 * 60) + (resetMinute * 60) + resetSecond;

    // Convert start and end times to their time of day in seconds
    const startDate = new Date(startTime * 1000);
    const endDate = new Date(endTime * 1000);

    const startTimeInSeconds = (startDate.getHours() * 60 * 60) + (startDate.getMinutes() * 60) + startDate.getSeconds();
    const endTimeInSeconds = (endDate.getHours() * 60 * 60) + (endDate.getMinutes() * 60) + endDate.getSeconds();

    // If the reset time is between the start and end time
    if (resetTimeInSeconds >= startTimeInSeconds && resetTimeInSeconds <= endTimeInSeconds) {
        return true;
    }
    return false;
}







//---------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------




// FOR UNPRODUCTIVE TIMER

let paused2 = true;
let timerInterval2;
let remainingTime2 = 0; // Variable to store the time remaining when paused2
chrome.storage.local.set({ totalTimeSpent2: 0 });

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const initialTab = tabs[0];

  chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
    const unproductiveSites = result.unproductiveSites || [];
    const productiveSites = result.productiveSites || [];

    console.log("Result from storage:", result); // Add this line for debugging

    if (initialTab) {
      const isInitialUnproductiveTab = unproductiveSites.some(url => initialTab.url.includes(url));

      // Set paused to true for an initial unproductive tab
      paused2 = isInitialUnproductiveTab;

      updateTimer2();
      timerInterval2 = setInterval(updateTimer2, 1000);
    }
  });
});


function updateTimer2() {
  chrome.storage.local.get(['targetDate2', 'paused2', 'totalTimeSpent2', 'timeAllowed', 'unproductiveSites', 'productiveSites'], (data) => {
    const targetDate2 = data.targetDate2;
    const storedPaused2 = data.paused2;
    let totalTimeSpent2 = data.totalTimeSpent2 || 0;
    let timeAllowed = data.timeAllowed;
    const unproductiveSites = data.unproductiveSites || [];
    const productiveSites = data.productiveSites || [];

    if (!targetDate2) {
      // Calculate the target date and start time if not available in storage
      const now = new Date().getTime();
      const fiveMinutesLater = new Date(now + timeAllowed * 1000).getTime();

      chrome.storage.local.set({
        targetDate2: fiveMinutesLater,
        startTime2: now,
        paused2: false,
        remainingTime2: timeAllowed * 1000,
        minutes2: Math.floor(timeAllowed / 60),
        seconds2: timeAllowed % 60,
      });

      return;
    }

    const now = new Date().getTime();
    var remainingTime2 = targetDate2 - now;

    if (remainingTime2 <= 0) {
      // Timer has expired, handle this case
      chrome.storage.local.set({ timer_expired: true });
      // Any additional actions you need to take when the timer has expired
      return;
    }

    // If the timer is still active, proceed with the rest of the function
    const secondsRemaining = Math.floor(remainingTime2 / 1000);
    const minutesRemaining = Math.floor(remainingTime2 / (1000 * 60));

    // Calculate the elapsed time on unproductive sites
    totalTimeSpent2 = (30 * 60) - secondsRemaining
    chrome.storage.local.set({ totalTimeSpent2: totalTimeSpent2 });
    const timeToshow2 = (totalTimeSpent2 / 60).toFixed(2); // time spent on unproductive sites

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return; // exit early if no tabs are returned
      const activeTab = tabs[0];

      const isUnproductiveSite = unproductiveSites.some(url => activeTab.url.includes(url));    // get unproductive sites list
      const isProductiveSite = productiveSites.some(url => activeTab.url.includes(url));        // get productive sites list

      if (isUnproductiveSite) {
        // Update the timer if the current tab is on an unproductive site
        if (storedPaused2) {
          clearInterval(timerInterval2); // Stop the timer if it was paused2
          paused2 = true;
          remainingTime2 = remainingTime2;
        } else if (remainingTime2 > 0) {
          // Update the timer as before
          const minutes2 = Math.floor(remainingTime2 / (1000 * 60));
          const seconds2 = Math.floor((remainingTime2 % (1000 * 60)) / 1000);
          chrome.storage.local.set({ minutes2: minutes2, seconds2: seconds2 });
        } else {
          chrome.storage.local.set({ timer_expired: true });
        }
      } else {
        // Pause the timer if the current tab is on a productive site
        paused2 = true;
        clearInterval(timerInterval2);
      }
    });

    chrome.storage.local.set({ timeRemaining2: remainingTime2 });

    if (storedPaused2) {
      clearInterval(timerInterval2); // Stop the timer if it was paused
      paused2 = true;
      remainingTime2 = remainingTime2;
    } else if (remainingTime2 > 0) {
      const minutes2 = Math.floor(remainingTime2 / (1000 * 60));
      const seconds2 = Math.floor((remainingTime2 % (1000 * 60)) / 1000);
      chrome.storage.local.set({ minutes2: minutes2, seconds2: seconds2 });

      // create notifications for 20, 10, 5, 2 and 1 min(s)
      const notifyTimes = [20, 10, 5, 2, 1];
      if (notifyTimes.includes(minutesRemaining)) {
        showNotification(minutesRemaining);
      }
    }
  });
}


function updateTimerDisplay2(timeRemaining) {
  const minutes2 = Math.floor(timeRemaining / (1000 * 60));
  const seconds2 = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  console.log("in updateTimerDisplay2, minutes2 is " + minutes2)
  console.log("in updateTimerDisplay2, seconds2 is " + seconds2)
  chrome.storage.local.set({ minutes2: minutes2, seconds2: seconds2 });
}

// function to send notifications as the timer starts to run out on unproductive sites
function showNotification(timeRemaining) {
  const notifOptions = {
    type: 'basic',
    iconUrl: 'FocusFlow48.png',
    title: `${timeRemaining} ${timeRemaining === 1 ? 'min' : 'mins'} left!!!`,
    message: "Maybe it's time to study!!"
  };

  const notificationId = `timeleftNotif_${timeRemaining}`;
  chrome.notifications.create(notificationId, notifOptions); // creates the notification
}



function togglePauseResume() {
  chrome.storage.local.get(['paused2', 'targetDate2'], (data) => {
    let { paused2, targetDate2 } = data;
    const now = new Date().getTime();

    if (paused2) {
      // If the timer is paused, resume it
      if (targetDate2 && targetDate2 > now) {
        // Calculate the remaining time and set a new target date
        const remainingTime2 = targetDate2 - now;
        const newTargetDate2 = now + remainingTime2;
        chrome.storage.local.set({ targetDate2: newTargetDate2, paused2: false });

        // Update the timer and set the interval
        updateTimer2();
        timerInterval2 = setInterval(updateTimer2, 1000);
      }
    } else {
      // If the timer is running, pause it
      if (targetDate2 && targetDate2 > now) {
        // Calculate the remaining time
        const remainingTime2 = targetDate2 - now;

        // Clear the interval and update paused state and remaining time
        clearInterval(timerInterval2);
        chrome.storage.local.set({ paused2: true, remainingTime2: remainingTime2 });
      }
    }
  });
}


function checkTabStatusForUnproductiveTimer(tab) {
  chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
        const unproductiveSites = result.unproductiveSites;
        const productiveSites = result.productiveSites;

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                const isUnproductiveSite = unproductiveSites.some(url => tabs[0].url.includes(url));
                const isProductiveSite = productiveSites.some(url => tabs[0].url.includes(url));

                if (isUnproductiveSite && paused2) {
                  togglePauseResume();
                } else if (!isUnproductiveSite && !paused2) {
                  togglePauseResume();
                }
            }
        });
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkTabStatusForUnproductiveTimer(tab);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    // Call a function to decide whether to pause or resume your unproductive timer.
    checkTabStatusForUnproductiveTimer(tab);
  }
});



function timerExpired() {
    chrome.storage.local.get(['timer_expired'], function(result) {
        var timer_expired = result.timer_expired;

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length > 0) {
                const activeTab = tabs[0];
                const activeTabURL = activeTab.url;

                chrome.storage.local.get(['unproductiveSites', 'productiveSites'], function(result) {
                    const unproductiveSites = result.unproductiveSites;
                    const productiveSites = result.productiveSites;

                    // Use unproductiveSites and productiveSites:
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        if (tabs[0]) {
                            const isUnproductiveSite = unproductiveSites.some(site => activeTabURL.includes(site));
                            if (isUnproductiveSite) {
                                console.log("Active tab is on an unproductive site.");
                            }
                            else if (timer_expired) {
                                console.log("Timer expired.");
                            }

                            if (isUnproductiveSite && timer_expired) {
                                console.log("Both conditions are met. Redirecting...");
                                chrome.tabs.update(activeTab.id, { url: 'alternate.html' });
                            }
                        }
                    })
                })
            }
        })
    })
}

// Declare and initialize lastUpdateTime2
var lastUpdateTime2 = Date.now();

// Function to pause the timer
function pauseTimer2() {
 if (!paused2) {
   clearInterval(timerInterval2); // Stop the timer if it's running
   paused2 = true;
   const now = Date.now();
   remainingTime2 -= now - lastUpdateTime2;
   chrome.storage.local.set({ paused2: true, remainingTime2: remainingTime2 });
 }
}

// Function to resume the timer
function resumeTimer2() {
 if (paused2 && isWindowFocused2) {
   if (remainingTime2 > 0) {
     lastUpdateTime2 = Date.now();
     timerInterval2 = setInterval(updateTimer2, 1000);
     paused2 = false;
     chrome.storage.local.set({ paused2: false });
   }
 }
}


// Function to handle window focus changes
function handleWindowFocusChange(windowId) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Window lost focus
        isWindowFocused2 = false;
        windowLostFocusTime2 = Date.now();
        pauseTimer2(); // Pause the timer when the window loses focus
        console.log("pause timer 2 requested")
    } else {
        // Window regained focus
        isWindowFocused2 = true;
        windowRegainedFocusTime2 = Date.now();

        // Instead of just togglePauseResume()
        // Check the active tab and decide to pause or resume the timer.
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                checkTabStatusForUnproductiveTimer(tabs[0]);
            }
        });
    }
}


// Event listener for window focus change
chrome.windows.onFocusChanged.addListener(handleWindowFocusChange);


var timerExpiredInterval = setInterval(timerExpired, 1000);