// FOR PRODUCTIVE TIMER

// used to keep track of whether the user is currently on a Reddit tab (true) or not (false)
let CHECKreddit = false;

// fetches the DOM element with the ID "timer"
let timer = document.getElementById('timer');

// This variable stores the starting time of the timer. It represents the time when the timer starts counting.
let startTime = 0;

// represents whether the timer is currently paused (true) or not (false)
let isPaused = false;

// helper function that takes the total number of seconds as input and converts it into a formatted string representing the time in the format HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// updates the timer display in the popup
function updateTimer() {
  chrome.storage.local.get(['isPaused', 'elapsedTime'], function (result) {
    isPaused = result.isPaused || false;
    console.log("isPaused value from popup.js is " + isPaused)
    startTime = result.elapsedTime || Math.floor(Date.now() / 1000);

    if (!isPaused) {
      const elapsedTime = Math.floor(Date.now() / 1000) - startTime;
      timer.innerText = formatTime(elapsedTime);
    } else {
      chrome.storage.local.get(['pausedTime'], function (result) {
        const pausedTime = result.pausedTime || 0;
        const elapsedTime = pausedTime - startTime;
        timer.innerText = formatTime(elapsedTime);
      });
    }
  });
  setTimeout(updateTimer, 1000);
}

setInterval(updateTimer, 1000);

// triggered when the window loses focus
window.addEventListener('blur', function () {
  // It saves the current isPaused state to the local storage
  chrome.storage.local.set({ isPaused: isPaused });
});

// triggered when the window gains focus again
window.addEventListener('focus', function () {
  // retrieves the stored values from the local storage: elapsedTime and isPaused
  chrome.storage.local.get(['elapsedTime', 'isPaused'], function (result) {
    // update the startTime and isPaused variables accordingly
    startTime = result.elapsedTime || Date.now() / 1000;
    isPaused = result.isPaused || false;

    // updating button text to either 'Resume' or 'Pause' based on the isPaused state
    /*if (isPaused) {
      pauseButton.innerText = 'Resume';
    } else {
      pauseButton.innerText = 'Pause';
    }*/
  });
});

// queries the currently active tab, retrieves the stored values from the local storage (elapsedTime and isPaused), and sets default values if they are not present
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.storage.local.get(['elapsedTime', 'isPaused'], function (result) {
    startTime = result.elapsedTime || Date.now() / 1000;
    isPaused = result.isPaused || false;
    // calls the updateTimer() function to start updating the timer display in the popup
    updateTimer();
  });
});






//---------------------------------------------------------------------------------------------------------------------------------------------------


// FOR UNPRODUCTIVE TIMER

document.addEventListener('DOMContentLoaded', () => {
  // Function to update the timer display in the popup
  function updateTimerDisplay2(minutes2, seconds2) {
    const timerElement = document.getElementById('timer2');
    var h = Math.floor(minutes2/60)     //hours
    var m = minutes2%60     //minutes
    var s = seconds2        //seconds
    //timerElement.innerText = `${h}:${m}:${s}`
    timerElement.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Function to display countdown expired message
  function countdownExpired2() {
      chrome.storage.local.get(['timer_expired'], (result) => {
        let timer_expired = result.timer_expired;
        if (timer_expired) {
          const timerElement = document.getElementById('timer2');
          timerElement.innerText = 'No more time allowed!';
        }
      });
  }



  function updateTimer2() {
      chrome.storage.local.get(['seconds2', 'minutes2', 'timer_expired'], (result) => {
        let seconds2 = result.seconds2;
        let minutes2 = result.minutes2;
        let timer_expired = result.timer_expired;

        if (timer_expired) {
          countdownExpired2();
        } else {
          updateTimerDisplay2(minutes2, seconds2);
        }
      });
  }

  setInterval(updateTimer2, 1000);

})
