// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CoursePayment {
    address public owner;
    uint256 public constant LESSON_PRICE  = 0.001 ether;
    uint256 public constant BUNDLE_PRICE  = 0.015 ether;
    uint256 public constant TOTAL_LESSONS = 21;

    mapping(address => mapping(uint256 => bool)) public lessonPurchased;
    mapping(address => bool) public bundlePurchased;

    event LessonPurchased(address indexed buyer, uint256 indexed lessonId, uint256 amount);
    event BundlePurchased(address indexed buyer, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function purchaseLesson(uint256 lessonId) external payable {
        require(lessonId >= 1 && lessonId <= TOTAL_LESSONS, "Invalid lesson ID");
        require(!bundlePurchased[msg.sender], "Bundle already owned - covers all lessons");
        require(!lessonPurchased[msg.sender][lessonId], "Lesson already purchased");
        require(msg.value >= LESSON_PRICE, "Insufficient ETH");

        lessonPurchased[msg.sender][lessonId] = true;
        emit LessonPurchased(msg.sender, lessonId, LESSON_PRICE);

        uint256 excess = msg.value - LESSON_PRICE;
        if (excess > 0) payable(msg.sender).transfer(excess);
    }

    function purchaseBundle() external payable {
        require(!bundlePurchased[msg.sender], "Bundle already owned");
        require(msg.value >= BUNDLE_PRICE, "Insufficient ETH");

        bundlePurchased[msg.sender] = true;
        emit BundlePurchased(msg.sender, BUNDLE_PRICE);

        uint256 excess = msg.value - BUNDLE_PRICE;
        if (excess > 0) payable(msg.sender).transfer(excess);
    }

    function hasAccess(address user, uint256 lessonId) external view returns (bool) {
        return bundlePurchased[user] || lessonPurchased[user][lessonId];
    }

    function hasBundleAccess(address user) external view returns (bool) {
        return bundlePurchased[user];
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");
        payable(owner).transfer(bal);
        emit Withdrawn(owner, bal);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
