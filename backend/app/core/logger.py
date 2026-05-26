import logging
import json
from datetime import datetime, timezone
from app.core.config import settings

# ── JSON Formatter (Production) ───────────────────────────────────


class JSONFormatter(logging.Formatter):
    """
    Formats log records as JSON for production.
    Makes logs searchable and machine-readable.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "compasslabs-backend",
            "environment": settings.APP_ENV,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }

        # Attach extra fields if provided
        # e.g. logger.info("msg", extra={"user_id": "abc"})
        for key, value in record.__dict__.items():
            if key not in {
                "name",
                "msg",
                "args",
                "levelname",
                "levelno",
                "pathname",
                "filename",
                "module",
                "funcName",
                "created",
                "msecs",
                "relativeCreated",
                "thread",
                "threadName",
                "processName",
                "process",
                "message",
                "exc_info",
                "exc_text",
                "stack_info",
                "lineno",
            }:
                log_entry[key] = value

        # Attach exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


# ── Human Readable Formatter (Development) ────────────────────────


class DevFormatter(logging.Formatter):
    """
    Formats log records in a clean human-readable way for development.
    """

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
        level = f"{color}{record.levelname:<8}{self.RESET}"
        location = f"{record.module}.{record.funcName}"
        message = record.getMessage()

        log_line = f"[{timestamp}] {level} {location} → {message}"

        if record.exc_info:
            log_line += f"\n{self.formatException(record.exc_info)}"

        return log_line


# ── Logger Factory ────────────────────────────────────────────────


def _get_log_level() -> int:
    """Return log level based on environment."""
    levels = {
        "development": logging.DEBUG,
        "staging": logging.INFO,
        "production": logging.WARNING,
    }
    return levels.get(settings.APP_ENV, logging.INFO)


def _setup_logger() -> logging.Logger:
    """Create and configure the application logger."""
    logger = logging.getLogger("compasslabs")
    logger.setLevel(_get_log_level())

    # Avoid duplicate handlers on reload
    if logger.handlers:
        return logger

    handler = logging.StreamHandler()
    handler.setLevel(_get_log_level())

    # Use JSON in production, human-readable in dev
    if settings.APP_ENV == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(DevFormatter())

    logger.addHandler(handler)

    # Prevent logs from bubbling to root logger
    logger.propagate = False

    return logger


# ── Single Logger Instance ────────────────────────────────────────
logger = _setup_logger()
