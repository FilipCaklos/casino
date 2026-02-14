# Royal Casino - Full Stack Gaming Platform

A modern, fully-featured online casino with multiple games, user authentication, database persistence, and production-ready deployment.

## Features

### 🎮 Games
- **Slots** - Classic 3-reel slots with multiple symbols and payouts
- **Blackjack** - Beat the dealer, hit 21
- **Roulette** - Spin the wheel with multiple betting options
- **Dice** - Roll for high/low predictions
- **Poker** - Hand comparison gameplay
- **Keno** - Number picking with huge multipliers

### 👤 User System
- User registration and authentication
- JWT-based security
- Account persistence
- Game statistics tracking
- Balance management

### 💳 Banking
- Real-time balance updates
- Coupon/promotional codes system
- Transaction history
- Game statistics

### ✨ UI/UX
- Professional casino design
- Smooth animations
- Victory celebrations with confetti
- Responsive mobile design
- Dark theme optimized for gaming

## Tech Stack

### Frontend
- HTML5
- CSS3 with animations
- Vanilla JavaScript
- Responsive design

### Backend
- Node.js
- Express.js
- MongoDB
- JWT authentication
- Docker containerization

## Quick Start

### Local Development
```bash
# Install dependencies
cd backend && npm install

# Configure environment
cp .env.example .env

# Run with Docker Compose
cd ..
docker-compose up
```

Visit: `http://localhost:5000`

**Demo Account:**
- Username: `test`
- Password: `test`

## Directory Structure

```
royal-casino/
├── backend/
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Authentication
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── styles.css
├── docker-compose.yml       # Multi-container setup
├── Dockerfile               # Backend image
├── DEPLOYMENT.md            # Deployment guide
└── README.md               # This file
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on:
- Local Docker setup
- DigitalOcean App Platform
- DigitalOcean Droplet
- DigitalOcean Kubernetes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/balance` - Get balance
- `POST /api/users/update-balance` - Update after game
- `POST /api/users/reset-balance` - Reset balance

### Coupons
- `POST /api/coupons/redeem` - Redeem coupon code
- `GET /api/coupons/all` - Get active coupons

### Transactions
- `POST /api/transactions/record` - Record game outcome
- `GET /api/transactions/history` - Get user history

## Security

- Password hashing with bcryptjs
- JWT token authentication
- CORS protection
- Rate limiting
- Helmet.js security headers
- Environment variable configuration

## Development

### Add New Game
1. Create game logic in frontend
2. Add API endpoint in `backend/routes/games.js`
3. Record transactions in database
4. Update user statistics

### Database Models
- **User** - Accounts, balance, stats
- **Transaction** - Game outcomes, bets, wins
- **Coupon** - Promotional codes

## Performance Considerations

- Frontend game logic runs client-side (fast)
- Balance updates sent to backend (secure)
- MongoDB indexes for fast queries
- Docker multi-stage builds for optimization
- Horizontal scaling ready

## Troubleshooting

### Games not working
- Check browser console for errors
- Verify JWT token in localStorage
- Check backend logs: `docker-compose logs backend`

### Database errors
- Verify MongoDB is running
- Check connection string in .env
- MongoDB should be accessible on `localhost:27017`

### Port conflicts
- Change ports in `docker-compose.yml`
- Or: `sudo lsof -i :5000` to find and kill process

## Future Enhancements

- [ ] Multiplayer functionality
- [ ] Live leaderboards
- [ ] Achievement system
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Sound effects

## License

MIT License - Feel free to use for personal or commercial projects

## Support

For issues and questions:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md)
2. Review backend logs
3. Check API documentation
