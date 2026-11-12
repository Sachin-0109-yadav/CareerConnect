from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_password_hashing():
    password = "CareerConnect_Test@123"

    hashed_password = hash_password(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("WrongPassword", hashed_password)


def test_jwt_access_token():
    user_id = "test-user-123"

    token = create_access_token(user_id)
    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["type"] == "access"


def test_invalid_token():
    payload = decode_access_token("invalid.token.value")

    assert payload is None