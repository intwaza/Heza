def test_login_succeeds_with_correct_credentials(client, nurse):
    response = client.post("/auth/login", data={"username": "nurse1", "password": "Password123!"})

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in_minutes"] == 15
    assert body["access_token"]


def test_login_fails_with_wrong_password(client, nurse):
    response = client.post("/auth/login", data={"username": "nurse1", "password": "wrong"})

    assert response.status_code == 401
    assert response.json()["detail"]["rw"] 


def test_login_fails_for_unknown_user(client):
    response = client.post("/auth/login", data={"username": "ghost", "password": "whatever"})
    assert response.status_code == 401


def test_me_requires_a_valid_token(client, nurse_headers):
    response = client.get("/auth/me", headers=nurse_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "nurse1"


def test_me_rejects_missing_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_only_facility_admin_can_initiate_password_reset(client, nurse, nurse_headers):
    response = client.post(f"/auth/password-reset/{nurse.id}", headers=nurse_headers)
    assert response.status_code == 403


def test_facility_admin_can_reset_a_worker_password_and_worker_can_use_it(
    client, db_session, nurse, admin_headers
):
    reset_response = client.post(f"/auth/password-reset/{nurse.id}", headers=admin_headers)
    assert reset_response.status_code == 200
    token = reset_response.json()["reset_token"]

    confirm_response = client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "NewPassword456!"}
    )
    assert confirm_response.status_code == 204

    old_password_login = client.post("/auth/login", data={"username": "nurse1", "password": "Password123!"})
    assert old_password_login.status_code == 401

    new_password_login = client.post("/auth/login", data={"username": "nurse1", "password": "NewPassword456!"})
    assert new_password_login.status_code == 200


def test_reset_token_cannot_be_reused(client, db_session, nurse, admin_headers):
    reset_response = client.post(f"/auth/password-reset/{nurse.id}", headers=admin_headers)
    token = reset_response.json()["reset_token"]

    first = client.post("/auth/password-reset/confirm", json={"token": token, "new_password": "First123!"})
    assert first.status_code == 204

    second = client.post("/auth/password-reset/confirm", json={"token": token, "new_password": "Second123!"})
    assert second.status_code == 400
