// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearningTracker {
    address public owner;
    uint256 public lessonFee = 0.001 ether;
    uint256 public constant TOTAL_LESSONS = 21;

    struct Learner {
        bool isRegistered;
        uint256 completedCount;
        bool certificateClaimed;
    }

    mapping(address => Learner) public learners;
    mapping(address => mapping(uint256 => bool)) public lessonsCompleted;
    mapping(address => mapping(uint256 => bool)) public lessonUnlocked;

    event LearnerRegistered(address indexed user);
    event LessonCompleted(address indexed user, uint256 lessonId);
    event LessonUnlocked(address indexed learner, uint256 lessonId);
    event PaymentReceived(address indexed from, uint256 amount);
    event CertificateClaimed(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function registerLearner() public {
        require(!learners[msg.sender].isRegistered, "Learner already registered");
        learners[msg.sender] = Learner({ isRegistered: true, completedCount: 0, certificateClaimed: false });
        emit LearnerRegistered(msg.sender);
    }

    function unlockLesson(uint256 lessonId) external payable {
        require(lessonId >= 1 && lessonId <= TOTAL_LESSONS, "Invalid lesson ID");
        require(msg.value >= lessonFee, "Insufficient payment");
        lessonUnlocked[msg.sender][lessonId] = true;
        emit LessonUnlocked(msg.sender, lessonId);
        emit PaymentReceived(msg.sender, msg.value);
    }

    function completeLesson(uint256 lessonId) public payable {
        require(learners[msg.sender].isRegistered, "Register first");
        require(lessonId >= 1 && lessonId <= TOTAL_LESSONS, "Invalid lesson ID");
        require(!lessonsCompleted[msg.sender][lessonId], "Lesson already completed");

        if (msg.value >= lessonFee) {
            lessonUnlocked[msg.sender][lessonId] = true;
            emit PaymentReceived(msg.sender, msg.value);
        } else {
            require(lessonUnlocked[msg.sender][lessonId], "Unlock lesson first");
        }

        lessonsCompleted[msg.sender][lessonId] = true;
        learners[msg.sender].completedCount += 1;
        emit LessonCompleted(msg.sender, lessonId);
    }

    function getProgress() public view returns (uint256 completedCount, bool certificateClaimed) {
        Learner memory learner = learners[msg.sender];
        return (learner.completedCount, learner.certificateClaimed);
    }

    function claimCertificate() public {
        require(learners[msg.sender].isRegistered, "Register first");
        require(learners[msg.sender].completedCount == TOTAL_LESSONS, "Complete all lessons first");
        require(!learners[msg.sender].certificateClaimed, "Certificate already claimed");
        learners[msg.sender].certificateClaimed = true;
        emit CertificateClaimed(msg.sender);
    }

    function isLessonCompleted(address user, uint256 lessonId) public view returns (bool) {
        require(lessonId >= 1 && lessonId <= TOTAL_LESSONS, "Invalid lesson ID");
        return lessonsCompleted[user][lessonId];
    }

    function setLessonFee(uint256 _fee) external onlyOwner {
        lessonFee = _fee;
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");
        payable(owner).transfer(bal);
    }

    function getLessonFee() external view returns (uint256) {
        return lessonFee;
    }
}
