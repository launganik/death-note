import React, { useState, useEffect } from 'react';
import './TransferAnimation.css';

interface TransferAnimationProps {
  isActive: boolean;
  inheritorAddress?: string;
  onComplete?: () => void;
}

/**
 * TransferAnimation component displays a 10-second countdown animation
 * during inheritance transfer with progress indicators
 */
const TransferAnimation: React.FC<TransferAnimationProps> = ({
  isActive,
  inheritorAddress,
  onComplete
}) => {
  const [countdown, setCountdown] = useState(10);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev - 1;
          if (newValue === 0) {
            setProgress(100); // Ensure progress is 100% at the end
            setIsComplete(true);
            onComplete?.();
          } else {
            setProgress((10 - newValue) * 10); // Calculate progress percentage
          }
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, countdown, onComplete]);

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setCountdown(10);
      setProgress(0);
      setIsComplete(false);
    }
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="transfer-animation" data-testid="transfer-animation">
      <div className="animation-container">
        {!isComplete ? (
          <>
            <h2>Transfer in Progress</h2>
            <p>Transferring tokens to inheritor...</p>
            
            <div className="countdown-container">
              <div className="progress-ring" data-testid="progress-ring">
                <svg width="120" height="120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#007bff"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="countdown-number">{countdown}</div>
              </div>
            </div>

            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="progress-text">{progress}% Complete</p>
          </>
        ) : (
          <div className="completion-message">
            <div className="success-icon">✅</div>
            <h2>Transfer Complete</h2>
            <p>
              {inheritorAddress 
                ? `Transfer Complete - tokens sent to ${inheritorAddress}`
                : 'Transfer Complete - tokens sent to the nominee'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferAnimation;
