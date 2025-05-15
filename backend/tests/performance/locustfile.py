from locust import HttpUser, task, between
import json
import random

class ResearchAssistantUser(HttpUser):
    wait_time = between(1, 5)  # 每个任务之间等待1-5秒
    
    def on_start(self):
        # 用户登录
        self.client.post("/api/v1/auth/login", json={
            "email": f"test{random.randint(1, 1000)}@example.com",
            "password": "password123"
        })
    
    @task(3)
    def search_papers(self):
        # 论文搜索接口测试
        keywords = ["AI", "Machine Learning", "Deep Learning", "Neural Networks", "Computer Vision"]
        self.client.get(
            "/api/v1/papers/search",
            params={
                "query": random.choice(keywords),
                "page": random.randint(1, 10),
                "per_page": 10
            }
        )
    
    @task(2)
    def analyze_innovation(self):
        # 创新点分析接口测试
        self.client.post(
            "/api/v1/analysis/innovation",
            json={
                "paper_id": random.randint(1, 100),
                "analysis_type": "detailed"
            }
        )
    
    @task(2)
    def track_progress(self):
        # 研究进度追踪接口测试
        self.client.get(
            f"/api/v1/progress/{random.randint(1, 50)}",
            params={"detail_level": "full"}
        )
    
    @task(1)
    def generate_report(self):
        # 报告生成接口测试
        self.client.post(
            "/api/v1/reports/generate",
            json={
                "project_id": random.randint(1, 30),
                "report_type": "research_summary",
                "time_range": "last_month"
            }
        )

# 运行命令：locust -f locustfile.py --host=http://localhost:8000
# Web界面：http://localhost:8089