package com.hundsun.bontal.config;

import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
@PropertySource("classpath:config/middleware.properties")
public class DataSourceConfig {

    @Value("${hs.datasource.default.url}")
    private String url;

    @Value("${hs.datasource.default.username}")
    private String username;

    @Value("${hs.datasource.default.password}")
    private String password;

    // 产品工厂数据源（双向同步用）
    @Value("${hs.datasource.prod.url:}")
    private String prodUrl;

    @Value("${hs.datasource.prod.username:}")
    private String prodUsername;

    @Value("${hs.datasource.prod.password:}")
    private String prodPassword;

    @Bean
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        ds.setMaximumPoolSize(10);
        ds.setMinimumIdle(2);
        return ds;
    }

    /**
     * 产品工厂数据源（fpic_prod_db）。未配置时返回空数据源，避免启动失败。
     */
    @Bean(name = "prodDataSource")
    public DataSource prodDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(prodUrl.isEmpty() ? url : prodUrl);
        ds.setUsername(prodUsername.isEmpty() ? username : prodUsername);
        ds.setPassword(prodPassword.isEmpty() ? password : prodPassword);
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        ds.setMaximumPoolSize(5);
        ds.setMinimumIdle(1);
        ds.setInitializationFailTimeout(-1); // 连不上也不阻止启动
        return ds;
    }

    @Bean(name = "prodJdbcTemplate")
    public JdbcTemplate prodJdbcTemplate(@Qualifier("prodDataSource") DataSource prodDataSource) {
        return new JdbcTemplate(prodDataSource);
    }

    @Bean(name = "defaultJdbcTemplate")
    public JdbcTemplate defaultJdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        MybatisSqlSessionFactoryBean factory = new MybatisSqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        factory.setTypeAliasesPackage("com.hundsun.bontal.canvas.model");
        return factory.getObject();
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
