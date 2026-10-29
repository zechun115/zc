
<div align="center">
<h1>
  <br/>项目健康度指标可视化平台
</h1>
</div>

![](https://img.shields.io/badge/License-MIT-blue)
![](https://img.shields.io/badge/Node-v15.14.0-blue)
[![](https://img.shields.io/badge/%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-green)](README-CN.md)

![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20213012.png)
![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20212919.png)
![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20204328.png)
![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20203642.png)

The Health Monitor Big Screen is developed as part of the OpenRank competition to evaluate and visualize project health metrics using OpenDigger data.

## About this project

An online-accessible, interactive visualization screen for monitoring and comparing project health metrics. Data is sourced from OpenDigger and processed for visualization and strategic decision-making.

The project is powered by Vue and Echarts, and aims to help enterprises optimize resource allocation and project management strategies.

## How to view ?

### Demo video

[ https://b23.tv/9uxECuE]( https://b23.tv/9uxECuE)
+ Access the application online by typing the following URL into your browser:[项目健康度指标可视化平台](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/%E9%A1%B9%E7%9B%AE%E5%81%A5%E5%BA%B7%E5%BA%A6%E6%8C%87%E6%A0%87%E5%8F%AF%E8%A7%86%E5%8C%96%E5%B9%B3%E5%8F%B0/%E5%81%A5%E5%BA%B7%E5%BA%A6%E6%8C%87%E6%A0%87%E5%8F%AF%E8%A7%86%E5%8C%96%E5%B9%B3%E5%8F%B0.html)
### Docker deployment

1. **Install Docker**: Ensure Docker is installed on your system. Follow the instructions in the official documentation: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/).

2. **Pull images**: Download the Docker image for the application using the following command:

   ```bash
   docker pull openrank/health-monitor:latest
   ```

3. **Run the container**: Start the application by running:

   ```bash
   docker run -d -p 8081:8081 openrank/health-monitor
   ```

   - The `-d` flag runs the container in the background.
   - The `-p 8081:8081` maps the container's port to the host system.

4. **Access the application**: Once the container is running, open `http://localhost:8081` in your browser to access the application. Use `docker stop container-id` to stop the container when needed.

### Github repository clone

Address: [https://github.com/X-Ethan/Zhayden-third-openrank](https://github.com/X-Ethan/Zhayden-third-openrank)

+ Clone the repository locally:

  ```bash
  git clone https://github.com/X-Ethan/Zhayden-third-openrank.git
  ```

+ Install dependencies (Node.js version 15.14.0 is recommended):

  ```bash
  cd HealthMonitorBigScreen
  npm install
  ```

+ Run the application (default port: 8080):

  ```bash
  npm run serve
  ```

## Introduction to the Health Monitor Visualization Screen

### Scenario and meaning

Monitoring project health is crucial for enterprises to identify high-potential projects, optimize resource allocation, and mitigate risks. By visualizing health metrics such as activity, community engagement, code quality, and development trends, the application helps stakeholders make informed decisions efficiently.

### Realization

The data for this big screen is sourced from:

- [OpenDigger](https://github.com/X-lab2017/open-digger)
- [Github API](https://docs.github.com/en/rest)

Technology stack: Vue 2.6, Echarts 5.3, RESTful API.

### Description of the work

#### **Thumbnail of the big screen**

![](https://markdown-picture-1302861826.cos.ap-shanghai.myqcloud.com/img/2023/10/16/20231016021040.gif)

### Key Features

#### **Health Metrics**

1. **Recent Activity Count**: Evaluates whether a project is active and attracting new users or contributors. When selecting open-source projects, developers prefer joining highly active ones, as this usually indicates frequent maintenance, quick issue resolution, and fast feature iteration.
2. **New Contributor Growth Rate**: Measures the project's attractiveness and its ability to expand the community. This metric is useful for project maintenance teams to monitor the health of the community. A low or negative growth rate may suggest a decline in the project's appeal, prompting actions like organizing events or improving documentation.
3. **Issue Response Rate**: Monitors the community's ability to support user feedback. A high response rate boosts user and developer confidence in the project, whereas a low response rate may lead to reduced community activity.
4. **Code Change Stability**:Assesses the project's stability and maturity, particularly for systems requiring long-term maintenance. Projects with unstable code changes may experience frequent large-scale modifications, potentially impacting version compatibility.
5. **Code Issue Density**:Evaluates the project's potential risks. High code issue density may indicate problems with code quality, affecting development efficiency or product reliability.
6. **OpenRank Trends**:Assesses the project's influence within the open-source ecosystem. This metric is used to observe whether a project is in a rapid development phase, making it suitable for long-term collaboration or investment decisions.
7. **Pull Request Acceptance Rate**:Measures the project's openness to external contributions. A high acceptance rate reflects a contributor-friendly project, while a low acceptance rate may discourage contributors, leading to their loss.

#### Data from a wide range of sources

The data for this large screen comes from 

- [X-lab2017](https://github.com/X-lab2017)
- [Github API](https://docs.github.com/en/rest)

The API of X-Lab2017 contains information about a wide variety of open source projects, as follows

![image-20231007232555038](https://markdown-picture-1302861826.cos.ap-shanghai.myqcloud.com/img/2023/10/08/20231008141228.png)

The Github API also allows you to find additional information, such as a map of the project's language distribution.

#### **Dynamic Interactive Queries**

The platform enables interactive querying by project name or author, dynamically updating the visualizations based on user inputs. For example, entering **X-lab2017/open-digger** will display data specific to that repository.
![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20194722.png)

#### **Interactive Charts**

For each chart, when hovering the mouse over it, you can perform operations such as panning, drag-and-zoom, value display, and AI invocation.

![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20214530.png)

![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20214453.png)

![](https://github.com/X-Ethan/Zhayden-third-openrank/blob/main/images/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-01-13%20214714.png)

#### **Comprehensive Insights**

Visualize metrics like Recent Activity Count, New Contributor Growth Rate, Issue Response Rate, Code Change Stability, Code Issue Density, OpenRank Trends and Pull Request Acceptance Rate to gain a 360-degree view of project health.

### Competition Takeaways

Through this project, the team gained valuable experience in end-to-end data visualization, combining advanced metrics with user-friendly interfaces to promote open-source adoption and enhance decision-making capabilities. Feedback and suggestions are welcome!
