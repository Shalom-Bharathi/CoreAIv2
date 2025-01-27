// Helper function to get icon paths
function getIconPath(icon) {
  const icons = {
    'trending-up': '<line x1="23" y1="6" x2="17" y2="12"></line><line x1="17" y1="12" x2="11" y2="6"></line><line x1="11" y1="6" x2="1" y2="16"></line>',
    'dumbbell': '<path d="m6.5 6.5 17.5 17.5"/><path d="m6.5 17.5 17.5-17.5"/><path d="m2 21 3-3"/><path d="m19 4 3-3"/><path d="m2 3 3 3"/><path d="m19 20 3 3"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
  };
  return icons[icon] || '';
}

// Initialize animations and interactions
function initializeAnimations() {
  // Animate feature cards on scroll
  const featureCards = document.querySelectorAll('.feature-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        
        // Animate the icon when card becomes visible
        gsap.from(entry.target.querySelector('.feature-icon'), {
          scale: 0,
          rotation: -180,
          duration: 0.6,
          ease: 'back.out(1.7)'
        });
        
        // Animate list items
        const listItems = entry.target.querySelectorAll('.feature-list li');
        gsap.from(listItems, {
          x: -20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }
    });
  }, {
    threshold: 0.2
  });

  featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    observer.observe(card);
  });

  // Enhanced hover animations for feature cards
  featureCards.forEach(card => {
    const icon = card.querySelector('.feature-icon');
    const listItems = card.querySelectorAll('.feature-list li');
    
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.02,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(icon, {
        scale: 1.1,
        rotation: '+=15',
        duration: 0.4,
        ease: 'power2.out'
      });
      
      gsap.to(listItems, {
        x: 5,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(icon, {
        scale: 1,
        rotation: '-=15',
        duration: 0.4,
        ease: 'power2.out'
      });
      
      gsap.to(listItems, {
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out'
      });
    });
  });
}

// Initialize widget container animations
function initializeWidgetContainer() {
  const widgetSection = document.querySelector('.ai-widget-section');
  
  // Create animated background gradient
  const gradient = document.createElement('div');
  gradient.className = 'gradient-background';
  widgetSection.insertBefore(gradient, widgetSection.firstChild);
  
  // Animate gradient
  gsap.to(gradient, {
    backgroundPosition: '200% 50%',
    duration: 15,
    repeat: -1,
    ease: 'none'
  });

  // Prepare the container for the vapi widget
  const widgetContainer = document.getElementById('vapi-widget');
  if (widgetContainer) {
    widgetContainer.style.minHeight = '300px';
    widgetContainer.style.width = '100%';
    
    // Add loading animation
    const loadingAnimation = document.createElement('div');
    loadingAnimation.className = 'loading-animation';
    loadingAnimation.innerHTML = `
      <div class="pulse"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    `;
    
    widgetContainer.appendChild(loadingAnimation);
    
    gsap.to(loadingAnimation.querySelector('svg'), {
      rotation: 360,
      duration: 1.5,
      repeat: -1,
      ease: 'linear'
    });
  }
}

// Event Listeners
function initializeEventListeners() {
  // Chart period buttons
  const chartButtons = document.querySelectorAll('.chart-button');
  chartButtons.forEach(button => {
    button.addEventListener('click', () => {
      chartButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // Start Workout button
  const startWorkoutBtn = document.querySelector('.button-primary');
  startWorkoutBtn.addEventListener('click', () => {
    gsap.to(startWorkoutBtn, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  });

  // Notification button
  const notificationBtn = document.querySelector('.notification-button');
  notificationBtn.addEventListener('click', () => {
    gsap.to(notificationBtn, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  });
}

// Initialize voice assistant functionality
document.addEventListener('DOMContentLoaded', () => {
  const startCallButton = document.getElementById('startCall');
  const vapiWidget = document.getElementById('vapi-widget');
  const aiStatus = document.querySelector('.ai-status');
  const callDuration = document.querySelector('.call-duration');
  const waveAnimation = document.querySelector('.wave-animation');
  let callTimer;
  let callStartTime;

  // Function to format time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Function to update call duration
  function updateCallDuration() {
    const currentTime = Math.floor((Date.now() - callStartTime) / 1000);
    callDuration.textContent = formatTime(currentTime);
  }

  // Function to start call
  function startCall() {
    if (!vapiInstance) return;

    // Update UI for call starting
    startCallButton.classList.add('calling');
    aiStatus.querySelector('.status-text').textContent = 'Connecting...';
    waveAnimation.style.display = 'none';
    
    // Show Vapi widget
    vapiWidget.classList.add('active');
    
    // Start the call using Vapi SDK
    vapiInstance.startCall().then(() => {
      // Call started successfully
      startCallButton.style.display = 'none';
      aiStatus.querySelector('.status-text').textContent = 'In call';
      waveAnimation.style.display = 'flex';
      
      // Start call duration timer
      callStartTime = Date.now();
      callTimer = setInterval(updateCallDuration, 1000);
    }).catch(error => {
      console.error('Failed to start call:', error);
      endCall();
    });
  }

  // Function to end call
  function endCall() {
    if (!vapiInstance) return;

    // Update UI for call ending
    startCallButton.classList.remove('calling');
    startCallButton.style.display = 'flex';
    aiStatus.querySelector('.status-text').textContent = 'Ready to assist';
    waveAnimation.style.display = 'none';
    vapiWidget.classList.remove('active');

    // Clear call duration timer
    if (callTimer) {
      clearInterval(callTimer);
      callTimer = null;
      callDuration.textContent = '00:00';
    }
  }

  // Event listeners
  startCallButton.addEventListener('click', startCall);

  // Listen for call end event from Vapi SDK
  if (vapiInstance) {
    vapiInstance.on('call_end', endCall);
  }

  // Initialize animations
  gsap.from('.ai-avatar', {
    duration: 1,
    y: 30,
    opacity: 0,
    ease: 'power3.out'
  });

  gsap.from('.feature-card', {
    duration: 0.8,
    y: 50,
    opacity: 0,
    stagger: 0.2,
    ease: 'power3.out'
  });

  // Animate avatar ring on hover
  const avatarRing = document.querySelector('.avatar-ring');
  if (avatarRing) {
    avatarRing.addEventListener('mouseenter', () => {
      gsap.to(avatarRing, {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    avatarRing.addEventListener('mouseleave', () => {
      gsap.to(avatarRing, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  }
});

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeCharts();
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
  populateRecommendations();
  initializeAnimations();
  initializeWidgetContainer();
  initializeEventListeners();
});