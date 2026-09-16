package com.hundsun.bontal;

import com.hundsun.jrescloud.common.boot.CloudApplication;
import com.hundsun.jrescloud.db.core.configuration.EnableCloudDataSource;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 画布管理服务 - 启动类
 * 通用画布/页面管理系统
 */
@CloudApplication(scanBasePackages = {"com.hundsun.bontal", "com.hundsun.ta"})
@EnableCloudDataSource
@EnableAspectJAutoProxy(exposeProxy = true)
@EnableScheduling
@MapperScan("com.hundsun.bontal.canvas.mapper")
public class CanvasServiceStarter {

    public static void main(String[] args) {
        SpringApplication.run(CanvasServiceStarter.class, args);
    }

}
