// Real-time Bidding Simulation
// In production, replace with WebSocket connection

const RealtimeBidding = {
    // Polling interval for checking updates (simulates real-time)
    pollInterval: 2000,
    lastUpdate: Date.now(),
    
    init() {
        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', (e) => {
            if (e.key === 'vintageShopData') {
                this.handleDataUpdate();
            }
        });
        
        // Start polling for updates
        this.startPolling();
        
        // Broadcast presence
        this.broadcastPresence();
    },
    
    startPolling() {
        setInterval(() => {
            this.checkForUpdates();
        }, this.pollInterval);
    },
    
    checkForUpdates() {
        const stored = localStorage.getItem('vintageShopData');
        if (stored) {
            const data = JSON.parse(stored);
            const lastBid = data.bids[data.bids.length - 1];
            
            if (lastBid && lastBid.timestamp > this.lastUpdate) {
                this.handleNewBid(lastBid, data);
                this.lastUpdate = lastBid.timestamp;
            }
        }
    },
    
    handleDataUpdate() {
        // Reload auctions when data changes in another tab
        if (typeof VintageShop !== 'undefined') {
            VintageShop.loadData();
            VintageShop.renderAuctions();
        }
    },
    
    handleNewBid(bid, data) {
        const auction = data.auctions.find(a => a.id === bid.auctionId);
        if (!auction) return;
        
        // Check if this is from another user
        const currentUser = data.currentUser;
        if (currentUser && bid.bidderId !== currentUser.id) {
            // Check if current user was outbid
            const userBids = data.bids.filter(b => 
                b.auctionId === bid.auctionId && 
                b.bidderId === currentUser.id
            );
            
            if (userBids.length > 0) {
                // User was outbid
                this.showOutbidNotification(auction, bid);
            }
        }
        
        // Update UI
        if (typeof VintageShop !== 'undefined') {
            VintageShop.renderAuctions();
        }
    },
    
    showOutbidNotification(auction, bid) {
        if (typeof VintageShop !== 'undefined') {
            VintageShop.showNotification(
                `You've been outbid on "${auction.title}"! New bid: $${bid.amount.toFixed(2)}`,
                'warning'
            );
        }
        
        // Also show browser notification if permitted
        this.showBrowserNotification(
            'Outbid Alert!',
            `Someone bid $${bid.amount.toFixed(2)} on ${auction.title}`
        );
    },
    
    showBrowserNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '6864f824b444ac66536ff5ba_8171c518-acbf-494f-baf9-ec8c8128ff59.avif'
            });
        }
    },
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },
    
    broadcastPresence() {
        // Track active users (simplified)
        const presence = {
            timestamp: Date.now(),
            page: window.location.pathname
        };
        localStorage.setItem('vintageShopPresence', JSON.stringify(presence));
    },
    
    // Simulate bid from another user (for demo purposes)
    simulateCompetitorBid(auctionId) {
        const stored = localStorage.getItem('vintageShopData');
        if (!stored) return;
        
        const data = JSON.parse(stored);
        const auction = data.auctions.find(a => a.id === auctionId);
        if (!auction || auction.status !== 'active') return;
        
        const competitorNames = ['VintageHunter', 'RetroCollector', 'AntiqueLover', 'ClassicFinder'];
        const randomName = competitorNames[Math.floor(Math.random() * competitorNames.length)];
        const bidIncrease = Math.floor(Math.random() * 20) + 5;
        
        const newBid = {
            id: Date.now(),
            auctionId,
            bidderId: 'competitor_' + Date.now(),
            bidderName: randomName,
            amount: auction.currentBid + bidIncrease,
            timestamp: Date.now()
        };
        
        data.bids.push(newBid);
        auction.currentBid = newBid.amount;
        auction.bidCount++;
        auction.lastBidderId = newBid.bidderId;
        
        localStorage.setItem('vintageShopData', JSON.stringify(data));
        
        // Trigger update
        this.handleDataUpdate();
        
        if (typeof VintageShop !== 'undefined') {
            VintageShop.showNotification(
                `${randomName} just bid $${newBid.amount.toFixed(2)} on "${auction.title}"!`,
                'info'
            );
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    RealtimeBidding.init();
    RealtimeBidding.requestNotificationPermission();
});

// Expose for demo purposes
window.RealtimeBidding = RealtimeBidding;
