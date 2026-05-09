package com.floodrescue.floodrescuesystem.config;

import com.floodrescue.floodrescuesystem.entity.Role;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.repository.RoleRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedRoles(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            createRoleIfMissing(roleRepository, "ADMIN", "System administrator");
            createRoleIfMissing(roleRepository, "COORDINATOR", "Rescue coordinator - dispatches teams");
            createRoleIfMissing(roleRepository, "MANAGER", "Resource manager - vehicles and relief supplies");
            createRoleIfMissing(roleRepository, "RESCUER", "Rescue team member");
            createRoleIfMissing(roleRepository, "CITIZEN", "Citizen using the platform");
            
            // Create default admin user
            createDefaultUserIfMissing(userRepository, roleRepository, passwordEncoder,
                    "admin", "Administrator", "admin@floodrescue.com", "ADMIN", "admin123");
            // Create default demo citizen
            createDefaultUserIfMissing(userRepository, roleRepository, passwordEncoder,
                    "demo", "Demo User", "demo@example.com", "CITIZEN", "demo123");
        };
    }

    private void createRoleIfMissing(RoleRepository roleRepository, String name, String description) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            roleRepository.save(role);
        }
    }

    private void createDefaultUserIfMissing(UserRepository userRepository, RoleRepository roleRepository,
                                            PasswordEncoder passwordEncoder,
                                            String username, String fullName, String email,
                                            String roleName, String password) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPhone("0123456789");
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setStatus("ACTIVE");
            user.setCreatedAt(LocalDateTime.now());
            
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException(roleName + " role not found"));
            user.setRole(role);
            
            userRepository.save(user);
        }
    }
}
