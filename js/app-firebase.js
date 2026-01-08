// Vintage Shop Bidding System - Firebase Version
// Uses Firestore for data, Firebase Auth for users, Storage for images

const VintageShop = {
    // Current user
    currentUser: null,
    
    // Unsubscribe functions for real-time listeners
    unsubscribers: [],

    // Initialize the application
    async init() {
        this.bindEvents();
        this.setupAuthListener();
        this.setupAuctionsListener();
        this.startTimers();
        setInterval(() => this.updateTimers(), 1000);
    },

    // Setup Firebase Auth listener
    setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = {
                    id: user.uid,
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0]
                };
                this.checkAuth();
                this.renderAuctions();
            } else {
                this.currentUser = null;
                this.checkAuth();
                this.renderAuctions();
            }
        });
    },

    // Setup real-time listener for auctions
    setupAuctionsListener() {
        const unsubscribe = db.collection('auctions')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                this.renderAuctions();
            }, (error) => {
                console.error('Auctions listener error:', error);
            });
        
        this.unsubscribers.push(unsubscribe);
    },

    // Check authentication status
    checkAuth() {
        const authBtn = document.getElementById('authBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (this.currentUser) {
            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                userName.textContent = this.currentUser.name;
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
        
        // Google Sign In
        document.getElementById('googleSignIn')?.addEventListener('click', () => this.handleGoogleSignIn());
        document.getElementById('googleSignInRegister')?.addEventListener('click', () => this.handleGoogleSignIn());
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Sell item modal
        document.getElementById('sellBtn')?.addEventListener('click', () => {
            if (!this.currentUser) {
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

    // Handle login with email/password
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            this.showNotification('Logging in...', 'info');
            await auth.signInWithEmailAndPassword(email, password);
            this.hideModal('authModal');
            this.showNotification('Welcome back!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(this.getErrorMessage(error.code), 'error');
        }
    },

    // Handle registration
    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            this.showNotification('Creating account...', 'info');
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with name
            await userCredential.user.updateProfile({ displayName: name });
            
            // Save user to Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.hideModal('authModal');
            this.showNotification('Account created successfully!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(this.getErrorMessage(error.code), 'error');
        }
    },

    // Handle Google Sign In
    async handleGoogleSignIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            this.showNotification('Signing in with Google...', 'info');
            const result = await auth.signInWithPopup(provider);
            
            // Save/update user in Firestore
            await db.collection('users').doc(result.user.uid).set({
                name: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            this.hideModal('authModal');
            this.showNotification('Welcome, ' + result.user.displayName + '!', 'success');
        } catch (error) {
            console.error('Google sign in error:', error);
            this.showNotification(this.getErrorMessage(error.code), 'error');
        }
    },

    // Handle logout
    async handleLogout() {
        try {
            await auth.signOut();
            this.showNotification('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Get user-friendly error messages
    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'This email is already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/popup-closed-by-user': 'Sign in cancelled',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        return messages[code] || 'An error occurred. Please try again.';
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

    // Convert image to base64 data URL (no storage needed)
    async uploadImage(file, auctionId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Compress image if too large
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Handle create auction
    async handleCreateAuction(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
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
        
        try {
            this.showNotification('Creating auction...', 'info');
            
            // Create auction document first to get ID
            const auctionRef = db.collection('auctions').doc();
            const auctionId = auctionRef.id;
            
            // Upload images
            const imageUrls = [];
            const files = imageInput.files;
            
            if (files.length > 0) {
                for (let i = 0; i < Math.min(files.length, 5); i++) {
                    const url = await this.uploadImage(files[i], auctionId);
                    imageUrls.push(url);
                }
            } else {
                // Default image
                imageUrls.push('https://via.placeholder.com/400x300?text=Vintage+Item');
            }
            
            // Create auction
            const auctionData = {
                id: auctionId,
                title,
                description,
                images: imageUrls,
                startingPrice,
                currentBid: startingPrice,
                sellerId: this.currentUser.id,
                sellerName: this.currentUser.name,
                sellerEmail: this.currentUser.email,
                endTime: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + (duration * 86400000))),
                category,
                condition,
                status: 'active',
                bidCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await auctionRef.set(auctionData);
            
            this.hideModal('sellModal');
            document.getElementById('sellForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            this.showNotification('Auction created successfully!', 'success');
            
        } catch (error) {
            console.error('Create auction error:', error);
            this.showNotification('Failed to create auction: ' + error.message, 'error');
        }
    },

    // Show bid modal
    async showBidModal(auctionId) {
        if (!this.currentUser) {
            this.showNotification('Please login to place a bid', 'error');
            this.showModal('authModal');
            return;
        }
        
        try {
            const doc = await db.collection('auctions').doc(auctionId).get();
            if (!doc.exists) return;
            
            const auction = doc.data();
            
            if (auction.sellerId === this.currentUser.id) {
                this.showNotification('You cannot bid on your own auction', 'error');
                return;
            }
            
            const endTime = auction.endTime.toDate();
            if (auction.status !== 'active' || endTime < new Date()) {
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
        } catch (error) {
            console.error('Show bid modal error:', error);
        }
    },

    // Load bid history for an auction
    async loadBidHistory(auctionId) {
        const historyContainer = document.getElementById('bidHistory');
        
        try {
            const snapshot = await db.collection('auctions').doc(auctionId)
                .collection('bids')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();
            
            if (snapshot.empty) {
                historyContainer.innerHTML = '<p class="no-bids">No bids yet. Be the first!</p>';
                return;
            }
            
            historyContainer.innerHTML = snapshot.docs.map(doc => {
                const bid = doc.data();
                return `
                    <div class="bid-history-item">
                        <span class="bidder-name">${bid.bidderName}</span>
                        <span class="bid-amount">$${bid.amount.toFixed(2)}</span>
                        <span class="bid-time">${this.formatTime(bid.timestamp?.toDate())}</span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Load bid history error:', error);
            historyContainer.innerHTML = '<p class="no-bids">Error loading bids</p>';
        }
    },

    // Handle place bid
    async handlePlaceBid(e) {
        e.preventDefault();
        
        const auctionId = document.getElementById('bidAuctionId').value;
        const amount = parseFloat(document.getElementById('bidAmount').value);
        
        try {
            // Use transaction to ensure atomic update
            await db.runTransaction(async (transaction) => {
                const auctionRef = db.collection('auctions').doc(auctionId);
                const auctionDoc = await transaction.get(auctionRef);
                
                if (!auctionDoc.exists) {
                    throw new Error('Auction not found');
                }
                
                const auction = auctionDoc.data();
                
                if (amount <= auction.currentBid) {
                    throw new Error('Bid must be higher than current bid');
                }
                
                // Update auction
                transaction.update(auctionRef, {
                    currentBid: amount,
                    bidCount: firebase.firestore.FieldValue.increment(1),
                    lastBidderId: this.currentUser.id,
                    lastBidderName: this.currentUser.name
                });
                
                // Add bid to subcollection
                const bidRef = auctionRef.collection('bids').doc();
                transaction.set(bidRef, {
                    bidderId: this.currentUser.id,
                    bidderName: this.currentUser.name,
                    amount: amount,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            // Update modal
            document.getElementById('bidCurrentPrice').textContent = '$' + amount.toFixed(2);
            document.getElementById('bidMinimum').textContent = 'Minimum bid: $' + (amount + 1).toFixed(2);
            document.getElementById('bidAmount').min = amount + 1;
            document.getElementById('bidAmount').value = amount + 5;
            
            this.loadBidHistory(auctionId);
            this.showNotification('Bid placed successfully! You are now the highest bidder.', 'success');
            
        } catch (error) {
            console.error('Place bid error:', error);
            this.showNotification(error.message || 'Failed to place bid', 'error');
        }
    },

    // Render all auctions
    async renderAuctions(filter = 'all', searchTerm = '') {
        const container = document.getElementById('auctionsGrid');
        if (!container) return;
        
        try {
            let query = db.collection('auctions').orderBy('createdAt', 'desc');
            const snapshot = await query.get();
            
            let auctions = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                endTime: doc.data().endTime?.toDate() || new Date()
            }));
            
            // Apply filter
            if (filter === 'ending-soon') {
                auctions = auctions.filter(a => a.status === 'active' && a.endTime - Date.now() < 86400000);
            } else if (filter === 'my-bids' && this.currentUser) {
                const myBidsSnapshot = await db.collectionGroup('bids')
                    .where('bidderId', '==', this.currentUser.id).get();
                const myBidAuctionIds = [...new Set(myBidsSnapshot.docs.map(d => d.ref.parent.parent.id))];
                auctions = auctions.filter(a => myBidAuctionIds.includes(a.id));
            } else if (filter === 'my-auctions' && this.currentUser) {
                auctions = auctions.filter(a => a.sellerId === this.currentUser.id);
            }
            
            // Apply search
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                auctions = auctions.filter(a => 
                    a.title?.toLowerCase().includes(term) || 
                    a.description?.toLowerCase().includes(term) ||
                    a.category?.toLowerCase().includes(term)
                );
            }
            
            if (auctions.length === 0) {
                container.innerHTML = '<div class="no-auctions"><p>No auctions found</p></div>';
                return;
            }
            
            container.innerHTML = auctions.map(auction => this.renderAuctionCard(auction)).join('');
        } catch (error) {
            console.error('Render auctions error:', error);
            container.innerHTML = '<div class="no-auctions"><p>Error loading auctions</p></div>';
        }
    },

    // Render single auction card
    renderAuctionCard(auction) {
        const timeLeft = this.getTimeLeft(auction.endTime);
        const isEnded = auction.endTime < Date.now();
        const isWinning = this.currentUser && auction.lastBidderId === this.currentUser.id;
        const isSeller = this.currentUser && auction.sellerId === this.currentUser.id;
        
        return `
            <div class="auction-card ${isEnded ? 'ended' : ''}" data-auction-id="${auction.id}">
                <div class="auction-image">
                    <img src="${auction.images?.[0] || 'https://via.placeholder.com/400x300'}" alt="${auction.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
                    <div class="auction-badge ${isEnded ? 'ended' : timeLeft.urgent ? 'urgent' : ''}">
                        ${isEnded ? 'ENDED' : timeLeft.text}
                    </div>
                    ${isWinning && !isEnded ? '<div class="winning-badge">Highest Bidder!</div>' : ''}
                    ${isSeller ? '<div class="seller-badge">Your Listing</div>' : ''}
                </div>
                <div class="auction-details">
                    <h3 class="auction-title">${auction.title}</h3>
                    <p class="auction-description">${(auction.description || '').substring(0, 80)}...</p>
                    <div class="auction-meta">
                        <span class="category-tag">${auction.category}</span>
                        <span class="condition-tag">${auction.condition}</span>
                    </div>
                    <div class="auction-pricing">
                        <div class="current-bid">
                            <span class="label">Current Bid</span>
                            <span class="price">$${auction.currentBid?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="bid-count">
                            <span class="count">${auction.bidCount || 0}</span> bids
                        </div>
                    </div>
                    <div class="auction-seller">
                        <span>Seller: ${auction.sellerName}</span>
                    </div>
                    <div class="auction-actions">
                        ${!isEnded && !isSeller ? 
                            `<button class="bid-button" onclick="VintageShop.showBidModal('${auction.id}')">Place Bid</button>` : 
                            isEnded ? '<span class="ended-text">Auction Ended</span>' : ''
                        }
                        <button class="details-button" onclick="VintageShop.showAuctionDetails('${auction.id}')">View Details</button>
                    </div>
                </div>
            </div>
        `;
    },

    // Show auction details
    async showAuctionDetails(auctionId) {
        try {
            const doc = await db.collection('auctions').doc(auctionId).get();
            if (!doc.exists) return;
            
            const auction = { ...doc.data(), id: doc.id, endTime: doc.data().endTime?.toDate() };
            const modal = document.getElementById('detailsModal');
            const content = document.getElementById('detailsContent');
            
            const timeLeft = this.getTimeLeft(auction.endTime);
            const isEnded = auction.endTime < Date.now();
            
            // Get bid history
            const bidsSnapshot = await db.collection('auctions').doc(auctionId)
                .collection('bids').orderBy('timestamp', 'desc').limit(20).get();
            const bids = bidsSnapshot.docs.map(d => ({ ...d.data(), timestamp: d.data().timestamp?.toDate() }));
            
            content.innerHTML = `
                <div class="details-grid">
                    <div class="details-images">
                        <div class="main-image">
                            <img src="${auction.images?.[0] || 'https://via.placeholder.com/400x300'}" alt="${auction.title}" id="mainDetailImage">
                        </div>
                        ${auction.images?.length > 1 ? `
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
                            <div class="price-row"><span>Starting Price:</span><span>$${auction.startingPrice?.toFixed(2)}</span></div>
                            <div class="price-row current"><span>Current Bid:</span><span class="current-price">$${auction.currentBid?.toFixed(2)}</span></div>
                            <div class="price-row"><span>Total Bids:</span><span>${auction.bidCount || 0}</span></div>
                        </div>
                        <div class="time-remaining ${isEnded ? 'ended' : timeLeft.urgent ? 'urgent' : ''}">
                            <span class="label">${isEnded ? 'Auction Ended' : 'Time Remaining:'}</span>
                            <span class="time">${isEnded ? '' : timeLeft.text}</span>
                        </div>
                        <div class="seller-info"><span>Seller: <strong>${auction.sellerName}</strong></span></div>
                        ${!isEnded && (!this.currentUser || auction.sellerId !== this.currentUser.id) ? `
                            <button class="bid-button large" onclick="VintageShop.hideModal('detailsModal'); VintageShop.showBidModal('${auction.id}');">Place Bid Now</button>
                        ` : ''}
                    </div>
                </div>
                <div class="bid-history-section">
                    <h3>Bid History</h3>
                    ${bids.length > 0 ? `
                        <div class="bid-history-list">
                            ${bids.map(bid => `
                                <div class="bid-history-item">
                                    <span class="bidder-name">${bid.bidderName}</span>
                                    <span class="bid-amount">$${bid.amount?.toFixed(2)}</span>
                                    <span class="bid-time">${this.formatTime(bid.timestamp)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="no-bids">No bids yet</p>'}
                </div>
            `;
            
            this.showModal('detailsModal');
        } catch (error) {
            console.error('Show details error:', error);
        }
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
        const end = endTime instanceof Date ? endTime.getTime() : endTime;
        const diff = end - now;
        
        if (diff <= 0) return { text: 'Ended', urgent: false };
        
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        let text = '';
        if (days > 0) text = `${days}d ${hours}h`;
        else if (hours > 0) text = `${hours}h ${minutes}m`;
        else text = `${minutes}m ${seconds}s`;
        
        return { text, urgent: diff < 3600000 };
    },

    // Format timestamp
    formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return date.toLocaleDateString();
    },

    // Start auction timers
    startTimers() { this.updateTimers(); },

    // Update all timers
    updateTimers() {
        document.querySelectorAll('.auction-badge:not(.ended)').forEach(badge => {
            const card = badge.closest('.auction-card');
            if (!card) return;
            const auctionId = card.dataset.auctionId;
            // Timer updates handled by re-render on data change
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
