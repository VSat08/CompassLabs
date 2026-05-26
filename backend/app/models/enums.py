import enum


class UserPlan(enum.Enum):
    FREE = "free"
    PRO = "pro"


class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"