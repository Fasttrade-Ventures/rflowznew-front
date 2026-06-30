import React, { useState, useEffect } from "react";
import { Box, Button, Image, Stack, Text, Title } from "@mantine/core";
import classes from "./CountdownTimer.module.css";
import { Link } from "@remix-run/react";

interface CountdownTimerProps {
  eventDate: string;
  showButton?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  eventDate,
  showButton = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      const currentTime = new Date().getTime();
      const eventTime = new Date(eventDate).getTime();
      let remainingTime = eventTime - currentTime;

      if (remainingTime <= 0) {
        remainingTime = 0;
        clearInterval(countdownInterval);
      }

      setTimeRemaining(remainingTime);
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [eventDate]);

  const formatTime = (time: number) => {
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const days = Math.floor(time / (1000 * 60 * 60 * 24));

    return (
      <div className={classes.timerDisplay}>
        <div className={classes.timerValue}>
          <span className={classes.timerValueNumber}>
            {days.toString().padStart(2, "0")}
          </span>
          <span className={classes.timerValueLabel}>days</span>
        </div>
        <div className={classes.timerValue}>
          <span className={classes.timerValueNumber}>
            {hours.toString().padStart(2, "0")}
          </span>
          <span className={classes.timerValueLabel}>hours</span>
        </div>
        <div className={classes.timerValue}>
          <span className={classes.timerValueNumber}>
            {minutes.toString().padStart(2, "0")}
          </span>
          <span className={classes.timerValueLabel}>minutes</span>
        </div>
        <div className={classes.timerValue}>
          <span className={classes.timerValueNumber}>
            {seconds.toString().padStart(2, "0")}
          </span>
          <span className={classes.timerValueLabel}>seconds</span>
        </div>
      </div>
    );
  };

  return (
    <Box className={classes.box}>
      <img
        className={classes.drZLeft}
        src="/images/dr-z.png"
        alt="Dr. Z Logo"
      />
      <img
        className={classes.drZRight}
        src="/images/dr-z.png"
        alt="Dr. Z Logo"
      />
      <div className={classes.timerContainer}>
        <Stack gap="md">
          <Stack gap={5}>
            <Title order={2} className={classes.timerName}>
              RflowZ Launching Day
            </Title>
            <Text size="lg" fw={500} c="var(--mantine-primary-color-5)">
              Sign up now to get 30 days of RflowZ!
            </Text>
          </Stack>
          {formatTime(timeRemaining)}
          <Text size="lg" fw={500} c="var(--mantine-primary-color-9)">
            Get it before it's too late!
          </Text>
          {showButton ? (
            <Box>
              <Button
                component={Link}
                to="/subscription"
                color="var(--mantine-primary-color-5)"
                size="lg"
              >
                🎊 Subscribe now 🎊
              </Button>
            </Box>
          ) : null}
        </Stack>
      </div>
    </Box>
  );
};

export default CountdownTimer;
