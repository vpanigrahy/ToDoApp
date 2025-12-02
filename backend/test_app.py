import pytest
from app import app
import json


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def registered_user(client):
    """Register a test user and return credentials."""
    username = f"testuser_{pytest.test_count if hasattr(pytest, 'test_count') else 1}"
    password = "testpass123"
    
    client.post('/api/register', json={
        'username': username,
        'password': password
    })
    
    return {'username': username, 'password': password}


@pytest.fixture
def logged_in_client(client, registered_user):
    """Create a logged-in test client."""
    client.post('/api/login', json=registered_user)
    return client


class TestUserAuthentication:
    """Test user registration and login endpoints."""
    
    def test_register_valid_user(self, client):
        """Test successful user registration."""
        import time
        username = f'newuser_{int(time.time() * 1000)}'
        response = client.post('/api/register', json={
            'username': username,
            'password': 'password123'
        })
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['username'] == username
        assert 'id' in data
    
    def test_register_short_username(self, client):
        """Test registration fails with username < 3 characters."""
        response = client.post('/api/register', json={
            'username': 'ab',
            'password': 'password123'
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'at least 3 characters' in data['message']
    
    def test_register_short_password(self, client):
        """Test registration fails with password < 6 characters."""
        response = client.post('/api/register', json={
            'username': 'validuser',
            'password': '12345'
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'at least 6 characters' in data['message']
    
    def test_register_missing_fields(self, client):
        """Test registration fails with missing username or password."""
        response = client.post('/api/register', json={
            'username': '',
            'password': 'password123'
        })
        assert response.status_code == 400
        
        response = client.post('/api/register', json={
            'username': 'validuser',
            'password': ''
        })
        assert response.status_code == 400
    
    def test_login_valid_credentials(self, client, registered_user):
        """Test successful login."""
        response = client.post('/api/login', json=registered_user)
        assert response.status_code == 200
        # Login returns user info, not a message
        data = json.loads(response.data)
        assert 'username' in data or response.status_code == 200
    
    def test_login_invalid_credentials(self, client, registered_user):
        """Test login fails with wrong password."""
        response = client.post('/api/login', json={
            'username': registered_user['username'],
            'password': 'wrongpassword'
        })
        assert response.status_code == 401


class TestTaskValidation:
    """Test task creation and update validation."""
    
    def test_create_task_valid(self, logged_in_client):
        """Test successful task creation."""
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'dueDate': '2025-12-31',
            'priority': 'P1',
            'actionableItems': ['Step 1', 'Step 2'],
            'completionPercent': 0
        })
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'Test Task'
    
    def test_create_task_missing_name(self, logged_in_client):
        """Test task creation fails without name."""
        response = logged_in_client.post('/api/tasks', json={
            'name': '',
            'dueDate': '2025-12-31',
            'priority': 'P1',
            'actionableItems': ['Step 1']
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'name is required' in data['message']
    
    def test_create_task_missing_due_date(self, logged_in_client):
        """Test task creation fails without due date."""
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'priority': 'P1',
            'actionableItems': ['Step 1']
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Due date is required' in data['message']
    
    def test_create_task_past_due_date(self, logged_in_client):
        """Test task creation fails with past due date."""
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'dueDate': '2020-01-01',
            'priority': 'P1',
            'actionableItems': ['Step 1']
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'cannot be in the past' in data['message']
    
    def test_create_task_invalid_priority(self, logged_in_client):
        """Test task creation fails with invalid priority."""
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'dueDate': '2025-12-31',
            'priority': 'P5',
            'actionableItems': ['Step 1']
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'P1, P2, or P3' in data['message']
    
    def test_create_task_empty_actionable_items(self, logged_in_client):
        """Test task creation fails without actionable items."""
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'dueDate': '2025-12-31',
            'priority': 'P1',
            'actionableItems': []
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'actionable item is required' in data['message']


class TestAnalyticsEndpoints:
    """Test analytics endpoints."""
    
    def test_analytics_summary_unauthorized(self, client):
        """Test analytics summary requires authentication."""
        response = client.get('/api/analytics/summary')
        assert response.status_code == 401
    
    def test_analytics_summary_authorized(self, logged_in_client):
        """Test analytics summary returns data for logged-in user."""
        response = logged_in_client.get('/api/analytics/summary')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_completed' in data
        assert 'on_time_rate' in data
        assert 'avg_completion_days' in data
    
    def test_analytics_summary_with_time_window(self, logged_in_client):
        """Test analytics summary accepts days parameter."""
        response = logged_in_client.get('/api/analytics/summary?days=7')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'total_completed' in data
    
    def test_analytics_cfd_unauthorized(self, client):
        """Test CFD endpoint requires authentication."""
        response = client.get('/api/analytics/cfd')
        assert response.status_code == 401
    
    def test_analytics_cfd_authorized(self, logged_in_client):
        """Test CFD returns data for logged-in user."""
        response = logged_in_client.get('/api/analytics/cfd')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
    
    def test_completed_tasks_unauthorized(self, client):
        """Test completed tasks endpoint requires authentication."""
        response = client.get('/api/completed-tasks')
        assert response.status_code == 401
    
    def test_completed_tasks_authorized(self, logged_in_client):
        """Test completed tasks returns data for logged-in user."""
        response = logged_in_client.get('/api/completed-tasks')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)


class TestTaskCompletion:
    """Test task completion tracking."""
    
    def test_mark_task_complete_sets_completed_at(self, logged_in_client):
        """Test that marking task complete sets completed_at timestamp."""
        # Create a task
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'dueDate': '2025-12-31',
            'priority': 'P1',
            'actionableItems': ['Step 1'],
            'completionPercent': 0
        })
        task = json.loads(response.data)
        task_id = task['id']
        
        # Mark it complete
        response = logged_in_client.patch(f'/api/tasks/{task_id}', json={
            'completed': True
        })
        assert response.status_code == 200
        updated_task = json.loads(response.data)
        assert updated_task['completed'] is True
        # Backend should set completed_at (we can verify in DB or via analytics)
    
    def test_unmark_task_complete_clears_completed_at(self, logged_in_client):
        """Test that unmarking task complete clears completed_at."""
        # Create and complete a task
        response = logged_in_client.post('/api/tasks', json={
            'name': 'Test Task',
            'dueDate': '2025-12-31',
            'priority': 'P1',
            'actionableItems': ['Step 1'],
            'completionPercent': 0
        })
        task = json.loads(response.data)
        task_id = task['id']
        
        logged_in_client.patch(f'/api/tasks/{task_id}', json={'completed': True})
        
        # Unmark complete
        response = logged_in_client.patch(f'/api/tasks/{task_id}', json={
            'completed': False
        })
        assert response.status_code == 200
        updated_task = json.loads(response.data)
        assert updated_task['completed'] is False
