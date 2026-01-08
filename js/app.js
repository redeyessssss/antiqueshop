// Vintage Shop Bidding System - Main Application
// Using localStorage for demo (replace with backend API in production)

const VintageShop = {
    // Initialize the application
    init() {
        this.loadData();
        this.bindEvents();
        this.renderAuctions();
        this.checkAuth();
        this.startTimers();
        setInterval(() => this.updateTimers(), 1000);
    },

    // Data storage
    data: {
        users: [],
        auctions: [],
        bids: [],
        currentUser: null
    },

    // Load data from localStorage
    loadData() {
        const stored = localStorage.getItem('vintageShopData');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            // Add sample auctions
            this.data.auctions = this.getSampleAuctions();
            this.saveData();
        }
    },

    // Save data to localStorage
    saveData() {
        localStorage.setItem('vintageShopData', JSON.stringify(this.data));
    },

    // Sample auctions for demo
    getSampleAuctions() {
        const now = Date.now();
        return [
            {
                id: 1,
                title: "Vintage 1960s Rotary Phone",
                description: "Beautiful mint condition rotary phone from the 1960s. Fully functional with original cord.",
                images: ["6864f824b444ac66536ff5ba_8171c518-acbf-494f-baf9-ec8c8128ff59.avif"],
                startingPrice: 50,
                currentBid: 75,
                sellerId: "demo_seller",
                sellerName: "VintageCollector",
                endTime: now + 86400000 * 2, // 2 days
                category: "Electronics",
                condition: "Excellent",
                status: "active",
                bidCount: 3
            },
            {
                id: 2,
                title: "Antique Brass Compass",
                description: "19th century brass compass with original leather case. Perfect for collectors.",
                images: ["6864f8243f927908c1d67bb5_40ae2aad-1c07-4a87-b681-35a35dc2a1c9.avif"],
                startingPrice: 120,
                currentBid: 185,
                sellerId: "demo_seller2",
                sellerName: "AntiqueFinder",
                endTime: now + 86400000, // 1 day
                category: "Collectibles",
                condition: "Good",
                status: "active",
                bidCount: 7
            },
            {
                id: 3,
                title: "Vintage Leather Suitcase",
                description: "1940s leather travel suitcase with brass hardware. Shows beautiful patina.",
                images: ["6864f824e634086667f8db9f_37e7b072-500a-43f5-a04b-93abdb6d5005.avif"],
                startingPrice: 80,
                currentBid: 80,
                sellerId: "demo_seller",
                sellerName: "VintageCollector",
                endTime: now + 86400000 * 3, // 3 days
                category: "Fashion",
                condition: "Fair",
                status: "active",
                bidCount: 0
            }
        ];
    },

    // Check authentication status
    checkAuth() {
        const authBtn = document.getElementById('authBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (this.data.currentUser) {
            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                userName.textContent = this.data.currentUser.name;
            }
        } else {
            if (authBtn) authBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    },

    // Bind all event listeners
    bindEvents() {
        // Auth modal
        document.getElementById('authBtn')?.addEventListener('click', () => this.showModal('authModal'));
        document.getElementById('closeAuthModal')?.addEventListener('click', () => this.hideModal('authModal'));
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForm('register');
        });
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForm('login');
        });
        
        // Auth forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Sell item modal
        document.getElementById('sellBtn')?.addEventListener('click', () => {
            if (!this.data.currentUser) {
                this.showNotification('Please login to sell items', 'error');
                this.showModal('authModal');
                return;
            }
            this.showModal('sellModal');
        });
        document.getElementById('closeSellModal')?.addEventListener('click', () => this.hideModal('sellModal'));
        document.getElementById('sellForm')?.addEventListener('submit', (e) => this.handleCreateAuction(e));
        
        // Image upload preview
        document.getElementById('itemImages')?.addEventListener('change', (e) => this.handleImagePreview(e));
        
        // Bid modal
        document.getElementById('closeBidModal')?.addEventListener('click', () => this.hideModal('bidModal'));
        document.getElementById('bidForm')?.addEventListener('submit', (e) => this.handlePlaceBid(e));
        
        // Close modals on outside click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal.id);
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterAuctions(e.target.dataset.filter));
        });

        // Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => this.searchAuctions(e.target.value));
    },

    // Toggle between login and register forms
    toggleAuthForm(type) {
        const loginForm = document.getElementById('loginFormContainer');
        const registerForm = document.getElementById('registerFormContainer');
        
        if (type === 'register') {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        } else {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        }
    },

    // Handle login
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const user = this.data.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.data.currentUser = user;
            this.saveData();
            this.checkAuth();
            this.hideModal('authModal');
            this.showNotification('Welcome back, ' + user.name + '!', 'success');
            this.renderAuctions();
        } else {
            this.showNotification('Invalid email or password', 'error');
        }
    },

    // Handle registration
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (this.data.users.find(u => u.email === email)) {
            this.showNotification('Email already registered', 'error');
            return;
        }
        
        const newUser = {
            id: 'user_' + Date.now(),
            name,
            email,
            password,
            createdAt: Date.now()
        };
        
        this.data.users.push(newUser);
        this.data.currentUser = newUser;
        this.saveData();
        this.checkAuth();
        this.hideModal('authModal');
        this.showNotification('Account created successfully!', 'success');
        this.renderAuctions();
    },

    // Handle logout
    handleLogout() {
        this.data.currentUser = null;
        this.saveData();
        this.checkAuth();
        this.showNotification('Logged out successfully', 'success');
        this.renderAuctions();
    },

    // Handle image preview
    handleImagePreview(e) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'preview-image';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    },

    // Handle create auction
    handleCreateAuction(e) {
        e.preventDefault();
        
        if (!this.data.currentUser) {
            this.showNotification('Please login to create an auction', 'error');
            return;
        }
        
        const title = document.getElementById('itemTitle').value;
        const description = document.getElementById('itemDescription').value;
        const category = document.getElementById('itemCategory').value;
        const condition = document.getElementById('itemCondition').value;
        const startingPrice = parseFloat(document.getElementById('startingPrice').value);
        const duration = parseInt(document.getElementById('auctionDuration').value);
        const imageInput = document.getElementById('itemImages');
        
        // Process images
        const images = [];
        const files = imageInput.files;
        
        if (files.length === 0) {
            // Use default image
            images.push('6864f824b444ac66536ff5ba_8171c518-acbf-494f-baf9-ec8c8128ff59.avif');
        }
        
        const processImages = () => {
            const newAuction = {
                id: Date.now(),
                title,
                description,
                images: images.length > 0 ? images : ['6864f824b444ac66536ff5ba_8171c518-acbf-494f-baf9-ec8c8128ff59.avif'],
                startingPrice,
                currentBid: startingPrice,
                sellerId: this.data.currentUser.id,
                sellerName: this.data.currentUser.name,
                endTime: Date.now() + (duration * 86400000),
                category,
                condition,
                status: 'active',
                bidCount: 0
            };
            
            this.data.auctions.unshift(newAuction);
            this.saveData();
            this.renderAuctions();
            this.hideModal('sellModal');
            document.getElementById('sellForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            this.showNotification('Auction created successfully!', 'success');
        };
        
        if (files.length > 0) {
            let processed = 0;
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    images.push(event.target.result);
                    processed++;
                    if (processed === files.length) {
                        processImages();
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            processImages();
        }
    },

    // Show bid modal
    showBidModal(auctionId) {
        if (!this.data.currentUser) {
            this.showNotification('Please login to place a bid', 'error');
            this.showModal('authModal');
            return;
        }
        
        const auction = this.data.auctions.find(a => a.id === auctionId);
        if (!auction) return;
        
        if (auction.sellerId === this.data.currentUser.id) {
            this.showNotification('You cannot bid on your own auction', 'error');
            return;
        }
        
        if (auction.status !== 'active' || auction.endTime < Date.now()) {
            this.showNotification('This auction has ended', 'error');
            return;
        }
        
        document.getElementById('bidAuctionId').value = auctionId;
        document.getElementById('bidItemTitle').textContent = auction.title;
        document.getElementById('bidCurrentPrice').textContent = '$' + auction.currentBid.toFixed(2);
        document.getElementById('bidMinimum').textContent = 'Minimum bid: $' + (auction.currentBid + 1).toFixed(2);
        document.getElementById('bidAmount').min = auction.currentBid + 1;
        document.getElementById('bidAmount').value = auction.currentBid + 5;
        
        // Load bid history
        this.loadBidHistory(auctionId);
        
        this.showModal('bidModal');
    },

    // Load bid history for an auction
    loadBidHistory(auctionId) {
        const historyContainer = document.getElementById('bidHistory');
        const auctionBids = this.data.bids
            .filter(b => b.auctionId === auctionId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        if (auctionBids.length === 0) {
            historyContainer.innerHTML = '<p class="no-bids">No bids yet. Be the first!</p>';
            return;
        }
        
        historyContainer.innerHTML = auctionBids.map(bid => `
            <div class="bid-history-item">
                <span class="bidder-name">${bid.bidderName}</span>
                <span class="bid-amount">$${bid.amount.toFixed(2)}</span>
                <span class="bid-time">${this.formatTime(bid.timestamp)}</span>
            </div>
        `).join('');
    },

    // Handle place bid
    handlePlaceBid(e) {
        e.preventDefault();
        
        const auctionId = parseInt(document.getElementById('bidAuctionId').value);
        const amount = parseFloat(document.getElementById('bidAmount').value);
        
        const auction = this.data.auctions.find(a => a.id === auctionId);
        if (!auction) return;
        
        if (amount <= auction.currentBid) {
            this.showNotification('Bid must be higher than current bid', 'error');
            return;
        }
        
        // Create bid record
        const bid = {
            id: Date.now(),
            auctionId,
            bidderId: this.data.currentUser.id,
            bidderName: this.data.currentUser.name,
            amount,
            timestamp: Date.now()
        };
        
        this.data.bids.push(bid);
        
        // Update auction
        auction.currentBid = amount;
        auction.bidCount++;
        auction.lastBidderId = this.data.currentUser.id;
        
        this.saveData();
        this.renderAuctions();
        this.loadBidHistory(auctionId);
        
        // Update modal
        document.getElementById('bidCurrentPrice').textContent = '$' + amount.toFixed(2);
        document.getElementById('bidMinimum').textContent = 'Minimum bid: $' + (amount + 1).toFixed(2);
        document.getElementById('bidAmount').min = amount + 1;
        document.getElementById('bidAmount').value = amount + 5;
        
        this.showNotification('Bid placed successfully! You are now the highest bidder.', 'success');
        
        // Simulate real-time notification to other users
        this.broadcastBidUpdate(auction, bid);
    },

    // Simulate real-time bid broadcast
    broadcastBidUpdate(auction, bid) {
        // In production, this would use WebSockets
        console.log('Bid update broadcast:', { auction: auction.title, bid: bid.amount, bidder: bid.bidderName });
    },

    // Render all auctions
    renderAuctions(filter = 'all', searchTerm = '') {
        const container = document.getElementById('auctionsGrid');
        if (!container) return;
        
        let auctions = [...this.data.auctions];
        
        // Apply filter
        if (filter === 'ending-soon') {
            auctions = auctions.filter(a => a.status === 'active' && a.endTime - Date.now() < 86400000);
        } else if (filter === 'my-bids' && this.data.currentUser) {
            const myBidAuctionIds = [...new Set(this.data.bids.filter(b => b.bidderId === this.data.currentUser.id).map(b => b.auctionId))];
            auctions = auctions.filter(a => myBidAuctionIds.includes(a.id));
        } else if (filter === 'my-auctions' && this.data.currentUser) {
            auctions = auctions.filter(a => a.sellerId === this.data.currentUser.id);
        }
        
        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            auctions = auctions.filter(a => 
                a.title.toLowerCase().includes(term) || 
                a.description.toLowerCase().includes(term) ||
                a.category.toLowerCase().includes(term)
            );
        }
        
        if (auctions.length === 0) {
            container.innerHTML = '<div class="no-auctions"><p>No auctions found</p></div>';
            return;
        }
        
        container.innerHTML = auctions.map(auction => this.renderAuctionCard(auction)).join('');
    },

    // Render single auction card
    renderAuctionCard(auction) {
        const timeLeft = this.getTimeLeft(auction.endTime);
        const isEnded = auction.endTime < Date.now();
        const isWinning = this.data.currentUser && auction.lastBidderId === this.data.currentUser.id;
        const isSeller = this.data.currentUser && auction.sellerId === this.data.currentUser.id;
        
        return `
            <div class="auction-card ${isEnded ? 'ended' : ''}" data-auction-id="${auction.id}">
                <div class="auction-image">
                    <img src="${auction.images[0]}" alt="${auction.title}" onerror="this.src='6864f824b444ac66536ff5ba_8171c518-acbf-494f-baf9-ec8c8128ff59.avif'">
                    <div class="auction-badge ${isEnded ? 'ended' : timeLeft.urgent ? 'urgent' : ''}">
                        ${isEnded ? 'ENDED' : timeLeft.text}
                    </div>
                    ${isWinning && !isEnded ? '<div class="winning-badge">Highest Bidder!</div>' : ''}
                    ${isSeller ? '<div class="seller-badge">Your Listing</div>' : ''}
                </div>
                <div class="auction-details">
                    <h3 class="auction-title">${auction.title}</h3>
                    <p class="auction-description">${auction.description.substring(0, 80)}...</p>
                    <div class="auction-meta">
                        <span class="category-tag">${auction.category}</span>
                        <span class="condition-tag">${auction.condition}</span>
                    </div>
                    <div class="auction-pricing">
                        <div class="current-bid">
                            <span class="label">Current Bid</span>
                            <span class="price">$${auction.currentBid.toFixed(2)}</span>
                        </div>
                        <div class="bid-count">
                            <span class="count">${auction.bidCount}</span> bids
                        </div>
                    </div>
                    <div class="auction-seller">
                        <span>Seller: ${auction.sellerName}</span>
                    </div>
                    <div class="auction-actions">
                        ${!isEnded && !isSeller ? 
                            `<button class="bid-button" onclick="VintageShop.showBidModal(${auction.id})">Place Bid</button>` : 
                            isEnded ? '<span class="ended-text">Auction Ended</span>' : ''
                        }
                        <button class="details-button" onclick="VintageShop.showAuctionDetails(${auction.id})">View Details</button>
                    </div>
                </div>
            </div>
        `;
    },

    // Show auction details
    showAuctionDetails(auctionId) {
        const auction = this.data.auctions.find(a => a.id === auctionId);
        if (!auction) return;
        
        const modal = document.getElementById('detailsModal');
        const content = document.getElementById('detailsContent');
        
        const timeLeft = this.getTimeLeft(auction.endTime);
        const isEnded = auction.endTime < Date.now();
        const auctionBids = this.data.bids.filter(b => b.auctionId === auctionId).sort((a, b) => b.timestamp - a.timestamp);
        
        content.innerHTML = `
            <div class="details-grid">
                <div class="details-images">
                    <div class="main-image">
                        <img src="${auction.images[0]}" alt="${auction.title}" id="mainDetailImage" onerror="this.src='6864f824b444ac66536ff5ba_8171c518-acbf-494f-baf9-ec8c8128ff59.avif'">
                    </div>
                    ${auction.images.length > 1 ? `
                        <div class="thumbnail-images">
                            ${auction.images.map((img, i) => `
                                <img src="${img}" alt="Thumbnail ${i+1}" onclick="document.getElementById('mainDetailImage').src='${img}'" class="thumbnail">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="details-info">
                    <h2>${auction.title}</h2>
                    <div class="details-meta">
                        <span class="category-tag">${auction.category}</span>
                        <span class="condition-tag">${auction.condition}</span>
                    </div>
                    <p class="details-description">${auction.description}</p>
                    
                    <div class="details-pricing">
                        <div class="price-row">
                            <span>Starting Price:</span>
                            <span>$${auction.startingPrice.toFixed(2)}</span>
                        </div>
                        <div class="price-row current">
                            <span>Current Bid:</span>
                            <span class="current-price">$${auction.currentBid.toFixed(2)}</span>
                        </div>
                        <div class="price-row">
                            <span>Total Bids:</span>
                            <span>${auction.bidCount}</span>
                        </div>
                    </div>
                    
                    <div class="time-remaining ${isEnded ? 'ended' : timeLeft.urgent ? 'urgent' : ''}">
                        <span class="label">${isEnded ? 'Auction Ended' : 'Time Remaining:'}</span>
                        <span class="time" data-end-time="${auction.endTime}">${isEnded ? '' : timeLeft.text}</span>
                    </div>
                    
                    <div class="seller-info">
                        <span>Seller: <strong>${auction.sellerName}</strong></span>
                    </div>
                    
                    ${!isEnded && (!this.data.currentUser || auction.sellerId !== this.data.currentUser.id) ? `
                        <button class="bid-button large" onclick="VintageShop.hideModal('detailsModal'); VintageShop.showBidModal(${auction.id});">
                            Place Bid Now
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="bid-history-section">
                <h3>Bid History</h3>
                ${auctionBids.length > 0 ? `
                    <div class="bid-history-list">
                        ${auctionBids.map(bid => `
                            <div class="bid-history-item">
                                <span class="bidder-name">${bid.bidderName}</span>
                                <span class="bid-amount">$${bid.amount.toFixed(2)}</span>
                                <span class="bid-time">${this.formatTime(bid.timestamp)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="no-bids">No bids yet</p>'}
            </div>
        `;
        
        this.showModal('detailsModal');
    },

    // Filter auctions
    filterAuctions(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
        this.renderAuctions(filter);
    },

    // Search auctions
    searchAuctions(term) {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        this.renderAuctions(activeFilter, term);
    },

    // Get time left for auction
    getTimeLeft(endTime) {
        const now = Date.now();
        const diff = endTime - now;
        
        if (diff <= 0) {
            return { text: 'Ended', urgent: false };
        }
        
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        let text = '';
        if (days > 0) {
            text = `${days}d ${hours}h`;
        } else if (hours > 0) {
            text = `${hours}h ${minutes}m`;
        } else {
            text = `${minutes}m ${seconds}s`;
        }
        
        return { text, urgent: diff < 3600000 }; // Urgent if less than 1 hour
    },

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return date.toLocaleDateString();
    },

    // Start auction timers
    startTimers() {
        this.updateTimers();
    },

    // Update all timers
    updateTimers() {
        document.querySelectorAll('.auction-badge:not(.ended)').forEach(badge => {
            const card = badge.closest('.auction-card');
            if (!card) return;
            
            const auctionId = parseInt(card.dataset.auctionId);
            const auction = this.data.auctions.find(a => a.id === auctionId);
            if (!auction) return;
            
            const timeLeft = this.getTimeLeft(auction.endTime);
            
            if (timeLeft.text === 'Ended') {
                badge.textContent = 'ENDED';
                badge.classList.add('ended');
                auction.status = 'ended';
                this.saveData();
                
                // Check if current user won
                if (this.data.currentUser && auction.lastBidderId === this.data.currentUser.id) {
                    this.showNotification(`Congratulations! You won the auction for "${auction.title}"!`, 'success');
                }
            } else {
                badge.textContent = timeLeft.text;
                if (timeLeft.urgent) {
                    badge.classList.add('urgent');
                }
            }
        });
        
        // Update detail modal timer if open
        document.querySelectorAll('.time-remaining .time[data-end-time]').forEach(el => {
            const endTime = parseInt(el.dataset.endTime);
            const timeLeft = this.getTimeLeft(endTime);
            el.textContent = timeLeft.text;
        });
    },

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },

    // Create notification container
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notifications';
        container.className = 'notifications-container';
        document.body.appendChild(container);
        return container;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => VintageShop.init());
