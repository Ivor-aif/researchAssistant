import os
from typing import List, Dict, Any
from openai import OpenAI

class VisionAPI:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    async def analyze_image(self, image_url: str, prompt: str = None) -> Dict[str, Any]:
        """分析图像内容，返回分析结果

        Args:
            image_url (str): 图像URL或本地路径
            prompt (str, optional): 分析提示。默认为None

        Returns:
            Dict[str, Any]: 分析结果
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt or "请分析这张图片的内容。"},
                            {"type": "image_url", "image_url": image_url}
                        ]
                    }
                ],
                max_tokens=300
            )
            return {"success": True, "result": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """分析文本内容，提取关键信息

        Args:
            text (str): 待分析的文本内容

        Returns:
            Dict[str, Any]: 分析结果
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的研究助手，擅长分析学术文本并提取关键信息。"
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                max_tokens=500
            )
            return {"success": True, "result": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}