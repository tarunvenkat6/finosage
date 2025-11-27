class PortfolioResults {
    constructor() {
        this.recommendations = null;
        this.allocationChart = null;
        this.volatilityChart = null;
        this.projectionChart = null;
        this.initializePage();
        this.setupEventListeners();
    }

    initializePage() {
        // Get recommendations from localStorage
        const storedRecommendations = localStorage.getItem('portfolioRecommendations');
        if (storedRecommendations) {
            this.recommendations = JSON.parse(storedRecommendations);
            this.updatePortfolioOverview();
            this.displayResults();
        } else {
            // Use sample data for demonstration
            this.useSampleData();
            this.updatePortfolioOverview();
            this.displayResults();
        }
    }

    useSampleData() {
        // Sample data for demonstration purposes
        this.recommendations = {
            portfolioAllocation: {
                equity: 60,
                debt: 30,
                alternatives: 10
            },
            allocationReasons: {
                equity: "Based on your moderate risk profile and long-term growth goals",
                debt: "Provides stability and regular income",
                alternatives: "Diversification and inflation hedge"
            },
            assetClassReasons: {
                equity: "Selected based on your moderate risk tolerance and long-term investment horizon",
                debt: "Provides stable returns and reduces portfolio volatility",
                alternatives: "Diversification and protection against market volatility"
            },
            riskMetrics: {
                volatilityLevel: "Medium",
                volatilityProfile: [7, 5, 6, 4, 5]
            },
            projectedReturns: {
                values: [100, 112, 175, 300]
            },
            investmentApproach: {
                method: "SIP",
                justification: "SIP is recommended for your profile as it helps in averaging out market volatility and building wealth systematically"
            },
            rebalancingStrategy: {
                frequency: "Semi-annual",
                justification: "Regular rebalancing helps maintain your target asset allocation and risk profile"
            },
            recommendedInvestments: {
                stocks: [
                    { name: "Reliance Industries", sector: "Energy", cagr: "15%" },
                    { name: "HDFC Bank", sector: "Banking", cagr: "12%" },
                    { name: "TCS", sector: "IT", cagr: "14%" }
                ],
                mutualFunds: [
                    { name: "SBI Blue Chip Fund", sector: "Large Cap", cagr: "14%" },
                    { name: "Mirae Asset Emerging Bluechip", sector: "Mid Cap", cagr: "18%" },
                    { name: "Axis Small Cap Fund", sector: "Small Cap", cagr: "20%" }
                ],
                etfs: [
                    { name: "Nippon India ETF Nifty 50", sector: "Large Cap", cagr: "13%" },
                    { name: "HDFC Nifty Bank ETF", sector: "Banking", cagr: "11%" }, 
                    { name: "SBI ETF Sensex", sector: "Large Cap", cagr: "12%" }
                ]
            }
        };
    }

    updatePortfolioOverview() {
        // Update risk level
        const riskLevelElement = document.querySelector('.portfolio-overview .risk-level');
        if (riskLevelElement) {
            riskLevelElement.textContent = this.recommendations.riskMetrics.volatilityLevel;
        }

        // Update last updated date
        const lastUpdatedElement = document.querySelector('.portfolio-overview .last-updated');
        if (lastUpdatedElement) {
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            lastUpdatedElement.textContent = formattedDate;
        }

        // Update risk score
        const riskScoreElement = document.querySelector('.portfolio-overview .risk-score');
        if (riskScoreElement) {
            // Calculate risk score based on volatility profile
            const volatilityProfile = this.recommendations.riskMetrics.volatilityProfile;
            const riskScore = (volatilityProfile.reduce((a, b) => a + b, 0) / volatilityProfile.length).toFixed(1);
            riskScoreElement.textContent = riskScore;
        }
    }

    setupEventListeners() {
        // Action buttons
        document.getElementById('savePortfolio').addEventListener('click', () => this.savePortfolio());
        document.getElementById('exportReport').addEventListener('click', () => this.exportReport());
        document.getElementById('startOver').addEventListener('click', () => this.startOver());
    }

    displayResults() {
        this.createAllocationChart();
        this.createVolatilityChart();
        this.createProjectionChart();
        this.updateAllocationDetails();
        this.updateAssetClasses();
        this.updateInvestmentRecommendations();
        this.updatePerformanceMetrics();
        this.updateStrategyDetails();
    }

    createAllocationChart() {
        const ctx = document.getElementById('allocationChart').getContext('2d');
        const data = {
            labels: ['Equity', 'Debt', 'Alternatives'],
            datasets: [{
                data: [
                    this.recommendations.portfolioAllocation.equity,
                    this.recommendations.portfolioAllocation.debt,
                    this.recommendations.portfolioAllocation.alternatives
                ],
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(5, 150, 105, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgb(79, 70, 229)',
                    'rgb(5, 150, 105)',
                    'rgb(245, 158, 11)'
                ],
                borderWidth: 1
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        },
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
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
        };

        // Destroy existing chart instance if it exists
        if (this.allocationChart) {
            this.allocationChart.destroy();
        }

        this.allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }

    createVolatilityChart() {
        const ctx = document.getElementById('volatilityChart').getContext('2d');
        const data = {
            labels: ['Market Risk', 'Interest Rate Risk', 'Inflation Risk', 'Credit Risk', 'Liquidity Risk'],
            datasets: [{
                label: 'Current Risk Profile',
                data: this.recommendations.riskMetrics.volatilityProfile,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(79, 70, 229, 1)'
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                }
            }
        };

        // Destroy existing chart instance if it exists
        if (this.volatilityChart) {
            this.volatilityChart.destroy();
        }

        this.volatilityChart = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: options
        });
    }

    createProjectionChart() {
        const ctx = document.getElementById('projectionChart').getContext('2d');
        const data = {
            labels: ['Current', '1 Year', '5 Years', '10 Years'],
            datasets: [{
                label: 'Portfolio Value',
                data: this.recommendations.projectedReturns.values,
                borderColor: 'rgba(79, 70, 229, 1)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                },
                x: {
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                }
            }
        };

        // Destroy existing chart instance if it exists
        if (this.projectionChart) {
            this.projectionChart.destroy();
        }

        this.projectionChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }

    updateAllocationDetails() {
        document.getElementById('equityAllocation').textContent = 
            `${this.recommendations.portfolioAllocation.equity}%`;
        document.getElementById('debtAllocation').textContent = 
            `${this.recommendations.portfolioAllocation.debt}%`;
        document.getElementById('alternativesAllocation').textContent = 
            `${this.recommendations.portfolioAllocation.alternatives}%`;

        document.getElementById('equityReason').textContent = 
            this.recommendations.allocationReasons.equity;
        document.getElementById('debtReason').textContent = 
            this.recommendations.allocationReasons.debt;
        document.getElementById('alternativesReason').textContent = 
            this.recommendations.allocationReasons.alternatives;
    }

    updateAssetClasses() {
        document.getElementById('equityJustification').textContent = 
            this.recommendations.assetClassReasons.equity;
        document.getElementById('debtJustification').textContent = 
            this.recommendations.assetClassReasons.debt;
        document.getElementById('alternativesJustification').textContent = 
            this.recommendations.assetClassReasons.alternatives;
    }

    updateInvestmentRecommendations() {
        // Find the recommendation cards within the recommendation-grid
        const recommendationCards = document.querySelectorAll('.recommendation-card');
        
        // If there are already 3 cards for stocks, mutual funds, and ETFs
        if (recommendationCards.length === 3) {
            // Update the investment items within each card
            const stocksCard = recommendationCards[0];
            const mutualFundsCard = recommendationCards[1];
            const etfsCard = recommendationCards[2];
            
            // Find the investment lists in each card
            const stocksList = stocksCard.querySelector('.investment-list');
            const mutualFundsList = mutualFundsCard.querySelector('.investment-list');
            const etfsList = etfsCard.querySelector('.investment-list');
            
            // Clear existing items
            stocksList.innerHTML = '';
            mutualFundsList.innerHTML = '';
            etfsList.innerHTML = '';
            
            // Add new items
            this.recommendations.recommendedInvestments.stocks.forEach(stock => {
                stocksList.appendChild(this.createInvestmentItem(stock));
            });
            
            this.recommendations.recommendedInvestments.mutualFunds.forEach(fund => {
                mutualFundsList.appendChild(this.createInvestmentItem(fund));
            });
            
            this.recommendations.recommendedInvestments.etfs.forEach(etf => {
                etfsList.appendChild(this.createInvestmentItem(etf));
            });
        }
    }
    
    createInvestmentItem(investment) {
        const item = document.createElement('div');
        item.className = 'investment-item';
        
        item.innerHTML = `
            <span class="name">${investment.name}</span>
            <span class="sector">${investment.sector}</span>
            <span class="cagr">${investment.cagr}</span>
        `;
        
        return item;
    }

    updatePerformanceMetrics() {
        document.getElementById('volatilityLevel').textContent = 
            this.recommendations.riskMetrics.volatilityLevel;
        document.getElementById('sharpeRatio').textContent = 
            this.recommendations.riskMetrics.sharpeRatio;
        document.getElementById('maxDrawdown').textContent = 
            this.recommendations.riskMetrics.maxDrawdown;

        document.getElementById('oneYearReturn').textContent = 
            `${this.recommendations.projectedReturns.oneYear}%`;
        document.getElementById('fiveYearReturn').textContent = 
            `${this.recommendations.projectedReturns.fiveYear}%`;
        document.getElementById('tenYearReturn').textContent = 
            `${this.recommendations.projectedReturns.tenYear}%`;
    }

    updateStrategyDetails() {
        document.getElementById('investmentMethod').textContent = 
            this.recommendations.investmentApproach.method;
        document.getElementById('investmentJustification').textContent = 
            this.recommendations.investmentApproach.justification;
        document.getElementById('rebalancingFrequency').textContent = 
            this.recommendations.rebalancingStrategy.frequency;
        document.getElementById('rebalancingJustification').textContent = 
            this.recommendations.rebalancingStrategy.justification;
    }

    createInvestmentCard(investment) {
        const card = document.createElement('div');
        card.className = 'investment-card';
        card.innerHTML = `
            <h4>${investment.name}</h4>
            <div class="type">${investment.sector}</div>
            <div class="risk risk-${investment.risk.toLowerCase()}">${investment.risk}</div>
            <div class="return">Expected Return: ${investment.cagr}</div>
        `;

        card.addEventListener('click', () => this.showInvestmentDetails(investment));
        return card;
    }

    showInvestmentDetails(investment) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${investment.name}</h3>
                    <button class="btn-icon close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <span class="detail-label">Type</span>
                        <span class="detail-value">${investment.sector}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Risk Level</span>
                        <span class="detail-value risk-${investment.risk.toLowerCase()}">${investment.risk}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Expected Return</span>
                        <span class="detail-value">${investment.cagr}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">CAGR</span>
                        <span class="detail-value">${investment.cagr}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Sharpe Ratio</span>
                        <span class="detail-value">${investment.sharpeRatio}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Max Drawdown</span>
                        <span class="detail-value">${investment.maxDrawdown}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    savePortfolio() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `portfolio-${timestamp}.json`;

        const blob = new Blob([JSON.stringify(this.recommendations, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showSuccess('Portfolio saved successfully!');
    }

    exportReport() {
        // Create Excel data
        let excelData = 'Portfolio Report\n\n';
        
        // Add Portfolio Overview
        excelData += 'Portfolio Overview\n';
        excelData += `Risk Level,${this.recommendations.riskMetrics.volatilityLevel}\n`;
        excelData += `Last Updated,${new Date().toLocaleDateString()}\n`;
        excelData += `Risk Score,${(this.recommendations.riskMetrics.volatilityProfile.reduce((a, b) => a + b, 0) / this.recommendations.riskMetrics.volatilityProfile.length).toFixed(1)}\n\n`;

        // Add Asset Allocation
        excelData += 'Asset Allocation\n';
        excelData += 'Asset Class,Allocation,Reason\n';
        excelData += `Equity,${this.recommendations.portfolioAllocation.equity}%,${this.recommendations.allocationReasons.equity}\n`;
        excelData += `Debt,${this.recommendations.portfolioAllocation.debt}%,${this.recommendations.allocationReasons.debt}\n`;
        excelData += `Alternatives,${this.recommendations.portfolioAllocation.alternatives}%,${this.recommendations.allocationReasons.alternatives}\n\n`;

        // Add Performance Metrics
        excelData += 'Performance Metrics\n';
        excelData += 'Metric,Value\n';
        excelData += `Volatility Level,${this.recommendations.riskMetrics.volatilityLevel}\n`;
        excelData += `Sharpe Ratio,${this.recommendations.riskMetrics.sharpeRatio}\n`;
        excelData += `Maximum Drawdown,${this.recommendations.riskMetrics.maxDrawdown}\n\n`;

        // Add Projected Returns
        excelData += 'Projected Returns\n';
        excelData += 'Time Period,Return\n';
        excelData += `1 Year,${this.recommendations.projectedReturns.oneYear}%\n`;
        excelData += `5 Years,${this.recommendations.projectedReturns.fiveYear}%\n`;
        excelData += `10 Years,${this.recommendations.projectedReturns.tenYear}%\n\n`;

        // Add Investment Recommendations
        excelData += 'Recommended Stocks\n';
        excelData += 'Name,Type,Risk,Expected Return,CAGR\n';
        this.recommendations.recommendedInvestments.stocks.forEach(stock => {
            excelData += `${stock.name},${stock.sector},${stock.risk},${stock.cagr}\n`;
        });
        excelData += '\n';

        excelData += 'Recommended Mutual Funds\n';
        excelData += 'Name,Type,Risk,Expected Return,CAGR\n';
        this.recommendations.recommendedInvestments.mutualFunds.forEach(fund => {
            excelData += `${fund.name},${fund.sector},${fund.risk},${fund.cagr}\n`;
        });
        excelData += '\n';

        excelData += 'Recommended ETFs\n';
        excelData += 'Name,Type,Risk,Expected Return,CAGR\n';
        this.recommendations.recommendedInvestments.etfs.forEach(etf => {
            excelData += `${etf.name},${etf.sector},${etf.risk},${etf.cagr}\n`;
        });
        excelData += '\n';

        // Add Investment Strategy
        excelData += 'Investment Strategy\n';
        excelData += `Recommended Method,${this.recommendations.investmentApproach.method}\n`;
        excelData += `Justification,${this.recommendations.investmentApproach.justification}\n`;
        excelData += `Rebalancing Frequency,${this.recommendations.rebalancingStrategy.frequency}\n`;
        excelData += `Rebalancing Justification,${this.recommendations.rebalancingStrategy.justification}\n`;

        // Create and download the Excel file
        const blob = new Blob([excelData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showSuccess('Report exported successfully!');
    }

    startOver() {
        window.location.href = 'portfolio-builder.html';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification ${type}`;
        notificationElement.textContent = message;
        
        document.body.appendChild(notificationElement);
        
        setTimeout(() => {
            notificationElement.classList.add('show');
            
            setTimeout(() => {
                notificationElement.classList.remove('show');
                
                setTimeout(() => {
                    document.body.removeChild(notificationElement);
                }, 300);
            }, 3000);
        }, 100);
    }
}

// Initialize the portfolio results when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioResults = new PortfolioResults();
});

// Theme Management
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);
themeToggle.querySelector('i').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}); 