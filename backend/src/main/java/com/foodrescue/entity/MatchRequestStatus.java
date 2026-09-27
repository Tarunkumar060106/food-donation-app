package com.foodrescue.entity;

public enum MatchRequestStatus {
    PENDING, ACCEPTED, DECLINED, WITHDRAWN,
    /** The food went to someone else, expired or was cancelled while this was still pending. */
    CLOSED
}
