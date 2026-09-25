package com.foodrescue.service;

import com.foodrescue.dto.UserResponse;
import com.foodrescue.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return users.findAllByOrderByCreatedAtDesc().stream().map(UserResponse::from).toList();
    }
}
