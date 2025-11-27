document.addEventListener('DOMContentLoaded', function() {
    // Check if we're using demo portfolio
    const usingDemo = localStorage.getItem('usingDemoPortfolio') === 'true';
    
    // Get username from localStorage if available
    const userName = localStorage.getItem('userName') || 'Guest';
    document.getElementById('userName').textContent = userName;
    
    // If not using demo, redirect back to analyzer
    if (!usingDemo && false) { // Disabled for demo purposes
        window.location.href = 'portfolio-analyzer.html';
    }
    
    // Set greeting based on time of day
    setTimeBasedGreeting();
    
    // Initialize all charts
    initializeCharts();
    
    // Initialize table functionality
    initializeHoldingsTable();
    
    // Initialize tabs
    initializeTabs();
    
    // Generate correlation matrix
    generateCorrelationMatrix();
    
    // Handle refresh button
    document.getElementById('refreshData').addEventListener('click', function() {
        this.classList.add('rotating');
        showNotification('Refreshing portfolio data...', 'info');
        
        // Simulate refresh delay
        setTimeout(() => {
            updateLastUpdated();
            this.classList.remove('rotating');
            showNotification('Portfolio data updated successfully', 'success');
        }, 1500);
    });
    
    // Update the last updated time
    updateLastUpdated();

    // Set time-based greeting
    function setTimeBasedGreeting() {
        const hour = new Date().getHours();
        let greeting = "Good Morning";
        
        if (hour >= 12 && hour < 17) {
            greeting = "Good Afternoon";
        } else if (hour >= 17) {
            greeting = "Good Evening";
        }
        
        document.getElementById('timeGreeting').textContent = greeting;
    }
    
    // Update last updated timestamp
    function updateLastUpdated() {
        const now = new Date();
        const options = { 
            hour: '2-digit', 
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
        };
        document.getElementById('lastUpdated').textContent = now.toLocaleString('en-IN', options);
    }
    
    // Initialize holdings table functionality
    function initializeHoldingsTable() {
        // Handle expand/collapse functionality
        const expandButtons = document.querySelectorAll('.expand-btn');
        expandButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                const assetCode = row.dataset.asset;
                const expandedRow = document.querySelector(`.expanded-row[data-asset="${assetCode}"]`);
                
                // Toggle icon
                this.querySelector('i').classList.toggle('fa-chevron-down');
                this.querySelector('i').classList.toggle('fa-chevron-up');
                
                // Toggle expanded row
                if (expandedRow.style.display === 'table-row') {
                    expandedRow.style.display = 'none';
                } else {
                    // Hide all other expanded rows first
                    document.querySelectorAll('.expanded-row').forEach(r => {
                        r.style.display = 'none';
                    });
                    // Reset all icons
                    document.querySelectorAll('.expand-btn i').forEach(icon => {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    });
                    // Show this row and update icon
                    expandedRow.style.display = 'table-row';
                    this.querySelector('i').classList.remove('fa-chevron-down');
                    this.querySelector('i').classList.add('fa-chevron-up');
                    
                    // Initialize mini chart for the expanded asset
                    initializeMiniChart(assetCode);
                }
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('holdingsSearch');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('tbody tr:not(.expanded-row)');
            
            rows.forEach(row => {
                const assetName = row.querySelector('.asset-name').textContent.toLowerCase();
                const shouldShow = assetName.includes(searchTerm);
                row.style.display = shouldShow ? 'table-row' : 'none';
                
                // Also hide associated expanded row
                const assetCode = row.dataset.asset;
                const expandedRow = document.querySelector(`.expanded-row[data-asset="${assetCode}"]`);
                if (expandedRow) {
                    expandedRow.style.display = 'none';
                }
                
                // Reset expand button icon
                const expandBtn = row.querySelector('.expand-btn i');
                if (expandBtn) {
                    expandBtn.classList.remove('fa-chevron-up');
                    expandBtn.classList.add('fa-chevron-down');
                }
            });
        });
        
        // Sector filter
        const sectorFilter = document.getElementById('sectorFilter');
        sectorFilter.addEventListener('change', function() {
            const selectedSector = this.value;
            const rows = document.querySelectorAll('tbody tr:not(.expanded-row)');
            
            rows.forEach(row => {
                if (selectedSector === 'all' || row.dataset.sector === selectedSector) {
                    row.style.display = 'table-row';
                } else {
                    row.style.display = 'none';
                    // Hide associated expanded row
                    const assetCode = row.dataset.asset;
                    const expandedRow = document.querySelector(`.expanded-row[data-asset="${assetCode}"]`);
                    if (expandedRow) {
                        expandedRow.style.display = 'none';
                    }
                }
            });
        });
        
        // Sorting functionality
        const sortableHeaders = document.querySelectorAll('th.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const sortBy = this.dataset.sort;
                const tbody = document.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr:not(.expanded-row)'));
                
                // Toggle sort direction
                const currentDir = this.getAttribute('data-direction') || 'asc';
                const newDir = currentDir === 'asc' ? 'desc' : 'asc';
                
                // Update header UI
                sortableHeaders.forEach(h => {
                    h.removeAttribute('data-direction');
                    h.querySelector('i').className = 'fas fa-sort';
                });
                this.setAttribute('data-direction', newDir);
                this.querySelector('i').className = `fas fa-sort-${newDir === 'asc' ? 'up' : 'down'}`;
                
                // Sort the rows
                rows.sort((a, b) => {
                    let aValue, bValue;
                    
                    switch(sortBy) {
                        case 'name':
                            aValue = a.querySelector('.primary-name').textContent;
                            bValue = b.querySelector('.primary-name').textContent;
                            break;
                        case 'price':
                        case 'avg':
                            aValue = parseFloat(a.querySelector(sortBy === 'price' ? '.current-price' : '.avg-price').textContent.replace('₹', '').replace(',', ''));
                            bValue = parseFloat(b.querySelector(sortBy === 'price' ? '.current-price' : '.avg-price').textContent.replace('₹', '').replace(',', ''));
                            break;
                        case 'quantity':
                            aValue = parseInt(a.querySelector('.quantity').textContent);
                            bValue = parseInt(b.querySelector('.quantity').textContent);
                            break;
                        case 'current':
                        case 'invested':
                            aValue = parseFloat(a.querySelector(sortBy === 'current' ? '.current-value' : '.invested').textContent.replace('₹', '').replace(',', ''));
                            bValue = parseFloat(b.querySelector(sortBy === 'current' ? '.current-value' : '.invested').textContent.replace('₹', '').replace(',', ''));
                            break;
                        case 'profit':
                            aValue = parseFloat(a.querySelector('.profit-amount').textContent.replace('₹', '').replace(',', '').replace('+', ''));
                            bValue = parseFloat(b.querySelector('.profit-amount').textContent.replace('₹', '').replace(',', '').replace('+', ''));
                            break;
                        case 'day':
                            aValue = parseFloat(a.querySelector('.day-percent').textContent.replace('%', '').replace('+', ''));
                            bValue = parseFloat(b.querySelector('.day-percent').textContent.replace('%', '').replace('+', ''));
                            break;
                        case 'sector':
                            aValue = a.querySelector('.sector').textContent;
                            bValue = b.querySelector('.sector').textContent;
                            break;
                        case 'weight':
                            aValue = parseFloat(a.querySelector('.weight').textContent.replace('%', ''));
                            bValue = parseFloat(b.querySelector('.weight').textContent.replace('%', ''));
                            break;
                        default:
                            return 0;
                    }
                    
                    if (aValue < bValue) return newDir === 'asc' ? -1 : 1;
                    if (aValue > bValue) return newDir === 'asc' ? 1 : -1;
                    return 0;
                });
                
                // Hide all expanded rows
                document.querySelectorAll('.expanded-row').forEach(row => {
                    row.style.display = 'none';
                });
                // Reset all expand buttons
                document.querySelectorAll('.expand-btn i').forEach(icon => {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                });
                
                // Reinsert rows in sorted order
                rows.forEach(row => {
                    const assetCode = row.dataset.asset;
                    const expandedRow = document.querySelector(`.expanded-row[data-asset="${assetCode}"]`);
                    
                    tbody.appendChild(row);
                    if (expandedRow) {
                        tbody.appendChild(expandedRow);
                    }
                });
            });
        });
        
        // View buttons (All, Stocks, Funds)
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active button
                viewButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const viewType = this.dataset.view;
                const rows = document.querySelectorAll('tbody tr:not(.expanded-row)');
                
                rows.forEach(row => {
                    const type = row.querySelector('td:nth-child(2)').textContent;
                    
                    if (viewType === 'all' || 
                        (viewType === 'stocks' && type === 'Stock') || 
                        (viewType === 'funds' && (type === 'ETF' || type === 'Mutual Fund'))) {
                        row.style.display = 'table-row';
                    } else {
                        row.style.display = 'none';
                        // Hide associated expanded row
                        const assetCode = row.dataset.asset;
                        const expandedRow = document.querySelector(`.expanded-row[data-asset="${assetCode}"]`);
                        if (expandedRow) {
                            expandedRow.style.display = 'none';
                        }
                    }
                });
            });
        });
    }
    
    // Initialize tabs for analytics section
    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show selected panel
                const targetTab = this.dataset.tab;
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }
    
    // Initialize mini chart for expanded asset rows
    function initializeMiniChart(assetCode) {
        const chartId = `chart${assetCode}`;
        const ctx = document.getElementById(chartId).getContext('2d');
        
        // Generate random price data for demo
        const labels = [];
        const data = [];
        let lastPrice = Math.random() * 1000 + 1000;
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
            
            lastPrice = lastPrice + (Math.random() * 60 - 30);
            data.push(lastPrice);
        }
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 150);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        
        // Create chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${assetCode} Price`,
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `₹${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 5
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Generate correlation matrix
    function generateCorrelationMatrix() {
        const assets = [
            { code: 'RELIANCE', name: 'Reliance' },
            { code: 'HDFCBANK', name: 'HDFC Bank' },
            { code: 'INFY', name: 'Infosys' },
            { code: 'TCS', name: 'TCS' },
            { code: 'ITC', name: 'ITC' },
            { code: 'NIFTY', name: 'Nifty 50' }
        ];
        
        // Matrix container
        const matrixEl = document.getElementById('correlationMatrix');
        if (!matrixEl) return;
        
        // Create header row
        let matrixHTML = '<div class="corr-row corr-header">';
        matrixHTML += '<div class="corr-cell"></div>'; // Empty corner cell
        
        // Add column headers
        assets.forEach(asset => {
            matrixHTML += `<div class="corr-cell">${asset.name}</div>`;
        });
        matrixHTML += '</div>';
        
        // Generate correlation data (random for demo)
        assets.forEach(rowAsset => {
            matrixHTML += `<div class="corr-row">`;
            matrixHTML += `<div class="corr-cell row-header">${rowAsset.name}</div>`;
            
            assets.forEach(colAsset => {
                let correlation;
                if (rowAsset.code === colAsset.code) {
                    correlation = 1; // Self correlation is always 1
                } else {
                    // Generate random correlation between -1 and 1
                    // With bias towards positive correlation and cluster effects
                    correlation = (Math.random() * 1.6 - 0.3);
                    correlation = Math.max(-1, Math.min(1, correlation)); // Clamp between -1 and 1
                }
                
                // Determine color based on correlation value
                let bgColor;
                if (correlation > 0.8) bgColor = '#15803d'; // Strong positive
                else if (correlation > 0.5) bgColor = '#65a30d'; // Moderate positive
                else if (correlation > 0.2) bgColor = '#84cc16'; // Weak positive
                else if (correlation > -0.2) bgColor = '#eab308'; // Neutral
                else if (correlation > -0.5) bgColor = '#f97316'; // Weak negative
                else if (correlation > -0.8) bgColor = '#ef4444'; // Moderate negative
                else bgColor = '#b91c1c'; // Strong negative
                
                matrixHTML += `<div class="corr-cell" style="background-color: ${bgColor};">${correlation.toFixed(2)}</div>`;
            });
            
            matrixHTML += `</div>`;
        });
        
        matrixEl.innerHTML = matrixHTML;
    }
    
    function initializeCharts() {
        // Asset Allocation Chart
        if (document.getElementById('assetAllocationChart')) {
            const assetCtx = document.getElementById('assetAllocationChart').getContext('2d');
            new Chart(assetCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Stocks', 'Mutual Funds', 'Bonds', 'ETFs', 'Cash'],
                    datasets: [{
                        data: [65.2, 18.5, 10.3, 4.2, 1.8],
                        backgroundColor: [
                            '#3b82f6', // Blue for Stocks
                            '#10b981', // Green for Mutual Funds
                            '#f59e0b', // Orange for Bonds
                            '#6366f1', // Purple for ETFs
                            '#ec4899'  // Pink for Cash
                        ],
                        borderColor: 'rgba(30, 41, 59, 0.8)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw}%`;
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        }
        
        // Sector Concentration Chart
        if (document.getElementById('sectorConcentrationChart')) {
            const sectorCtx = document.getElementById('sectorConcentrationChart').getContext('2d');
            new Chart(sectorCtx, {
                type: 'bar',
                data: {
                    labels: ['Technology', 'Financial', 'Energy', 'Consumer', 'Healthcare', 'Industrials'],
                    datasets: [{
                        label: 'Allocation (%)',
                        data: [27.8, 24.6, 22.2, 11.5, 8.7, 5.2],
                        backgroundColor: '#3b82f6',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#f8fafc'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#f8fafc'
                            }
                        }
                    }
                }
            });
        }
        
        // Benchmark Comparison
        if (document.getElementById('benchmarkComparisonChart')) {
            const benchmarkCtx = document.getElementById('benchmarkComparisonChart').getContext('2d');
            const dates = [];
            const today = new Date();
            
            // Generate dates for the last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - i);
                dates.push(date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
            }
            
            // Generate portfolio and benchmark data
            const portfolioData = [];
            const niftyData = [];
            const sensexData = [];
            
            let portfolioValue = 100;
            let niftyValue = 100;
            let sensexValue = 100;
            
            for (let i = 0; i < 12; i++) {
                // Random changes each month (slightly biased for portfolio to outperform)
                portfolioValue *= (1 + (Math.random() * 0.06 - 0.02));
                niftyValue *= (1 + (Math.random() * 0.05 - 0.02));
                sensexValue *= (1 + (Math.random() * 0.05 - 0.02));
                
                portfolioData.push(portfolioValue);
                niftyData.push(niftyValue);
                sensexData.push(sensexValue);
            }
            
            new Chart(benchmarkCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Your Portfolio',
                            data: portfolioData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false
                        },
                        {
                            label: 'Nifty 50',
                            data: niftyData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Sensex',
                            data: sensexData,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#f8fafc',
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#f8fafc'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#f8fafc',
                                callback: function(value) {
                                    return value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Drawdown Chart
        if (document.getElementById('drawdownChart')) {
            const drawdownCtx = document.getElementById('drawdownChart').getContext('2d');
            const dates = [];
            const today = new Date();
            
            // Generate dates for the last 24 months
            for (let i = 23; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - i);
                dates.push(date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
            }
            
            // Generate drawdown data
            const drawdownData = [];
            for (let i = 0; i < 24; i++) {
                // Create some significant drawdowns
                if (i === 5) drawdownData.push(-8.2);
                else if (i === 6) drawdownData.push(-12.1);
                else if (i === 7) drawdownData.push(-7.8);
                else if (i === 8) drawdownData.push(-4.2);
                else if (i === 9) drawdownData.push(-1.5);
                else if (i === 10) drawdownData.push(0);
                else if (i === 18) drawdownData.push(-5.7);
                else if (i === 19) drawdownData.push(-12.4);
                else if (i === 20) drawdownData.push(-9.2);
                else if (i === 21) drawdownData.push(-3.1);
                else if (i === 22) drawdownData.push(-0.8);
                else if (i === 23) drawdownData.push(0);
                else drawdownData.push(0);
            }
            
            new Chart(drawdownCtx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Drawdown (%)',
                        data: drawdownData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `Drawdown: ${context.raw}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#f8fafc',
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#f8fafc',
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            max: 5,
                            min: -15
                        }
                    }
                }
            });
        }
        
        // Expense Chart
        if (document.getElementById('expenseChart')) {
            const expenseCtx = document.getElementById('expenseChart').getContext('2d');
            new Chart(expenseCtx, {
                type: 'pie',
                data: {
                    labels: ['Management Fees', 'Transaction Costs', 'Custodian Fees', 'Advisory Fees'],
                    datasets: [{
                        data: [0.45, 0.15, 0.07, 0.04],
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#6366f1'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#f8fafc',
                                boxWidth: 12,
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw}%`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Income Chart
        if (document.getElementById('incomeChart')) {
            const incomeCtx = document.getElementById('incomeChart').getContext('2d');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            new Chart(incomeCtx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Dividend Income',
                            data: [1250, 0, 2790, 0, 3450, 0, 2850, 0, 3760, 0, 4200, 14564],
                            backgroundColor: '#10b981'
                        },
                        {
                            label: 'Interest Income',
                            data: [456, 478, 512, 489, 467, 501, 523, 478, 445, 512, 475, 269],
                            backgroundColor: '#3b82f6'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#f8fafc',
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ₹${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#f8fafc'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#f8fafc',
                                callback: function(value) {
                                    return '₹' + value;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Notification function
    function showNotification(message, type) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set notification content and type
        notification.textContent = message;
        notification.className = 'notification ' + type;
        
        // Add show class to trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}); 