package com.hundsun.jrescloud.common.boot;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan
public @interface CloudApplication {
    String[] scanBasePackages() default {};
}
