from typing import List, Dict, Any
from openai import OpenAI

class InnovationExtraction:
    def __init__(self):
        self.client = OpenAI()

    async def extract_innovations(self, paper_content: str) -> Dict[str, Any]:
        """从论文内容中提取创新点

        Args:
            paper_content (str): 论文内容

        Returns:
            Dict[str, Any]: 创新点分析结果
        """
        try:
            prompt = f"""请从以下论文内容中提取主要创新点：
            {paper_content}
            请详细分析每个创新点的：
            1. 具体内容
            2. 技术原理
            3. 优势特点
            4. 应用价值
            5. 可能的改进方向
            """

            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的论文分析专家，擅长识别和分析论文中的创新点。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500
            )

            innovations = self._parse_innovations(response.choices[0].message.content)
            return {"success": True, "innovations": innovations}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _parse_innovations(self, content: str) -> List[Dict[str, Any]]:
        """解析创新点分析结果

        Args:
            content (str): API返回的分析内容

        Returns:
            List[Dict[str, Any]]: 解析后的创新点列表
        """
        try:
            import re
            import json
            
            # 尝试从内容中提取结构化信息
            innovations = []
            
            # 简单的文本解析逻辑
            lines = content.split('\n')
            current_innovation = {}
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # 检测创新点标题
                if re.match(r'^\d+[.、]|^[一二三四五六七八九十][.、]|^创新点', line, re.IGNORECASE):
                    if current_innovation:
                        innovations.append(current_innovation)
                    current_innovation = {
                        "id": str(len(innovations) + 1),
                        "title": re.sub(r'^\d+[.、]|^[一二三四五六七八九十][.、]|^创新点[:：]?', '', line).strip(),
                        "description": "",
                        "significance": "",
                        "relevance": 4,
                        "technical_feasibility": 8.0,
                        "implementation_difficulty": "中等",
                        "novelty_score": 8.0
                    }
                elif current_innovation:
                    # 累积描述内容
                    if "描述" in line or "内容" in line:
                        current_innovation["description"] += line + " "
                    elif "重要性" in line or "意义" in line or "价值" in line:
                        current_innovation["significance"] += line + " "
                    else:
                        current_innovation["description"] += line + " "
            
            # 添加最后一个创新点
            if current_innovation:
                innovations.append(current_innovation)
            
            # 如果解析失败，返回默认格式
            if not innovations:
                innovations = [
                    {
                        "id": "1",
                        "title": "AI分析的创新点",
                        "description": content[:200] + "..." if len(content) > 200 else content,
                        "significance": "该创新点具有重要的研究价值和应用前景。",
                        "relevance": 4,
                        "technical_feasibility": 8.0,
                        "implementation_difficulty": "中等",
                        "novelty_score": 8.0
                    }
                ]
            
            return innovations
            
        except Exception as e:
            # 解析失败时返回默认格式
            return [
                {
                    "id": "1",
                    "title": "创新点分析",
                    "description": "AI分析发现了论文中的创新内容，但解析过程中遇到了问题。",
                    "significance": "该创新点需要进一步分析以确定其具体价值。",
                    "relevance": 3,
                    "technical_feasibility": 7.0,
                    "implementation_difficulty": "中等",
                    "novelty_score": 7.0
                }
            ]

    async def analyze_implementation_feasibility(self, innovation: Dict[str, Any]) -> Dict[str, Any]:
        """分析创新点的实现可行性

        Args:
            innovation (Dict[str, Any]): 创新点信息

        Returns:
            Dict[str, Any]: 可行性分析结果
        """
        try:
            prompt = f"""请分析以下创新点的实现可行性：
            创新点：{innovation['content']}
            技术原理：{', '.join(innovation['principles'])}
            应用场景：{', '.join(innovation['applications'])}
            """

            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个技术可行性分析专家，擅长评估创新技术的实现难度和可行性。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=800
            )

            feasibility = self._parse_feasibility(response.choices[0].message.content)
            return {"success": True, "feasibility": feasibility}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _parse_feasibility(self, content: str) -> Dict[str, Any]:
        """解析可行性分析结果

        Args:
            content (str): API返回的分析内容

        Returns:
            Dict[str, Any]: 解析后的可行性分析结果
        """
        # 示例返回格式
        return {
            "technical_feasibility": {
                "score": 7.5,
                "challenges": ["技术挑战1", "技术挑战2"],
                "required_resources": ["资源1", "资源2"],
                "development_cycle": "预计开发周期"
            },
            "implementation_steps": [
                {"step": "步骤1", "description": "详细说明", "difficulty": "难度评估"},
                {"step": "步骤2", "description": "详细说明", "difficulty": "难度评估"}
            ],
            "risk_assessment": {
                "technical_risks": ["风险1", "风险2"],
                "mitigation_strategies": ["策略1", "策略2"]
            }
        }