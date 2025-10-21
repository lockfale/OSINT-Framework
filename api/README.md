# OSINT Framework REST API

RESTful API for programmatic access to OSINT Framework tools data.

## Quick Start

```bash
# Install dependencies (from project root)
npm install

# Start API server
npm run api

# API available at http://localhost:3000
```

## Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "dataLoaded": true,
  "dataLoadTime": "2025-01-17T10:30:00.000Z",
  "uptime": 123.456
}
```

---

### Get All Tools
```http
GET /api/tools?category=username&search=github&limit=10&offset=0
```

**Query Parameters:**
- `category` (optional): Filter by category name
- `search` (optional): Search query
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "total": 1360,
  "limit": 10,
  "offset": 0,
  "count": 10,
  "tools": [
    {
      "id": "YWJjMTIzNDU2Nzg5MA==",
      "name": "Sherlock (T)",
      "url": "https://github.com/sherlock-project/sherlock",
      "category": "Username > Search Engines",
      "path": ["Username", "Search Engines", "Sherlock (T)"],
      "metadata": {
        "isManual": false,
        "isDork": false,
        "requiresRegistration": false,
        "isTool": true
      }
    }
  ]
}
```

---

### Get Tool by ID
```http
GET /api/tools/:id
```

**Response:**
```json
{
  "id": "YWJjMTIzNDU2Nzg5MA==",
  "name": "Sherlock (T)",
  "url": "https://github.com/sherlock-project/sherlock",
  "category": "Username > Search Engines",
  "path": ["Username", "Search Engines", "Sherlock (T)"],
  "metadata": {
    "isManual": false,
    "isDork": false,
    "requiresRegistration": false,
    "isTool": true
  }
}
```

---

### Get Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "total": 42,
  "categories": [
    "Username",
    "Email Address",
    "Domain Name",
    "IP Address",
    "..."
  ]
}
```

---

### Get Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "totalTools": 1360,
  "totalCategories": 42,
  "byType": {
    "manual": 138,
    "dorks": 87,
    "requiresRegistration": 245,
    "localTools": 56
  },
  "topCategories": [
    { "name": "Username", "count": 234 },
    { "name": "Email Address", "count": 189 },
    { "name": "Domain Name", "count": 156 }
  ]
}
```

---

### Get Tree Structure
```http
GET /api/tree
```

Returns the complete hierarchical tree structure (same as `arf.json`).

---

### Search Tools
```http
GET /api/search?q=github&limit=20
```

**Query Parameters:**
- `q` (required): Search query (min 2 characters)
- `limit` (optional): Max results (default: 20)

**Response:**
```json
{
  "query": "github",
  "total": 15,
  "results": [
    {
      "id": "...",
      "name": "GitHub User (M)",
      "url": "https://github.com/",
      "category": "Username > Specific Sites"
    }
  ]
}
```

---

### Reload Data (Admin)
```http
POST /api/reload
```

Reloads `arf.json` from disk without restarting the server.

**Response:**
```json
{
  "success": true,
  "dataLoadTime": "2025-01-17T11:00:00.000Z"
}
```

---

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Response**: 429 Too Many Requests with `retryAfter` header

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Query must be at least 2 characters"
}
```

### 404 Not Found
```json
{
  "error": "Tool not found"
}
```

### 429 Rate Limit
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

---

## Configuration

Environment variables:

```bash
PORT=3000  # API port (default: 3000)
NODE_ENV=production  # Environment
```

---

## CORS

CORS is enabled for all origins. For production, restrict to specific domains:

```javascript
app.use(cors({
  origin: 'https://osintframework.com'
}));
```

---

## Example Usage

### cURL
```bash
# Get all username tools
curl "http://localhost:3000/api/tools?category=username"

# Search for email tools
curl "http://localhost:3000/api/search?q=email&limit=5"

# Get statistics
curl "http://localhost:3000/api/stats"
```

### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/tools?search=github');
const data = await response.json();
console.log(data.tools);
```

### Python
```python
import requests

response = requests.get('http://localhost:3000/api/tools', params={'category': 'username'})
tools = response.json()['tools']
print(tools)
```

---

## Deployment

### Docker (Future)
```bash
docker build -t osint-api .
docker run -p 3000:3000 osint-api
```

### PM2
```bash
pm2 start api/server.js --name osint-api
pm2 save
```

---

## Security Considerations

1. **Rate limiting**: In-memory (resets on restart). Use Redis for production.
2. **Input validation**: Basic validation included. Add schema validation for production.
3. **Authentication**: No auth required. Add API keys for production.
4. **HTTPS**: Use reverse proxy (nginx) for SSL termination.

---

## Future Enhancements

- [ ] GraphQL endpoint
- [ ] WebSocket for real-time updates
- [ ] API key authentication
- [ ] Redis-based rate limiting
- [ ] Elasticsearch integration for advanced search
- [ ] Tool health monitoring
- [ ] User favorites and ratings

---

## License

ISC (same as OSINT Framework)
