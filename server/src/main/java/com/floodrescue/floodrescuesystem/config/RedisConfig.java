package com.floodrescue.floodrescuesystem.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cấu hình Redis cho caching và lưu trữ token blacklist.
 * <p>
 * Các cache name và TTL tương ứng:
 * <ul>
 *   <li><b>dashboard</b> – Thống kê dashboard (TTL ngắn, dữ liệu thay đổi liên tục)</li>
 *   <li><b>shelters</b> – Danh sách nơi trú ẩn</li>
 *   <li><b>floodAlerts</b> – Cảnh báo lũ lụt</li>
 *   <li><b>rescueTeams</b> – Đội cứu hộ</li>
 * </ul>
 */
@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${app.cache.ttl.dashboard:60}")
    private long dashboardTtl;

    @Value("${app.cache.ttl.shelters:300}")
    private long sheltersTtl;

    @Value("${app.cache.ttl.flood-alerts:120}")
    private long floodAlertsTtl;

    @Value("${app.cache.ttl.rescue-teams:180}")
    private long rescueTeamsTtl;

    /**
     * ObjectMapper hỗ trợ Java 8 date/time (LocalDateTime, LocalDate, v.v.)
     * Dùng chung cho cả RedisTemplate và CacheManager.
     */
    private GenericJackson2JsonRedisSerializer jsonRedisSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                mapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL
        );
        return new GenericJackson2JsonRedisSerializer(mapper);
    }

    /**
     * RedisTemplate cho các thao tác Redis thủ công (token blacklist, rate-limiting, v.v.)
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    /**
     * CacheManager với TTL riêng cho từng cache.
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(jsonRedisSerializer()))
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(5)); // TTL mặc định

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("dashboard", defaultConfig.entryTtl(Duration.ofSeconds(dashboardTtl)));
        cacheConfigs.put("shelters", defaultConfig.entryTtl(Duration.ofSeconds(sheltersTtl)));
        cacheConfigs.put("floodAlerts", defaultConfig.entryTtl(Duration.ofSeconds(floodAlertsTtl)));
        cacheConfigs.put("rescueTeams", defaultConfig.entryTtl(Duration.ofSeconds(rescueTeamsTtl)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .transactionAware()
                .build();
    }
}

