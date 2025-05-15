#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import argparse

def run_backend_tests(performance=False):
    """运行后端测试"""
    print("\n===== 运行后端单元测试 =====")
    backend_test_cmd = ["pytest", "backend/tests", "-v"]
    if not performance:
        backend_test_cmd.append("-k", "not performance")
    subprocess.run(backend_test_cmd)
    
    if performance:
        print("\n===== 运行后端性能测试 =====")
        performance_test_cmd = ["pytest", "backend/tests/performance", "-v"]
        subprocess.run(performance_test_cmd)

def run_frontend_tests():
    """运行前端测试"""
    print("\n===== 运行前端测试 =====")
    frontend_test_cmd = ["npm", "test"]
    subprocess.run(frontend_test_cmd)

def main():
    parser = argparse.ArgumentParser(description="运行 AI 研究助手项目的测试")
    parser.add_argument(
        "--backend-only", 
        action="store_true", 
        help="只运行后端测试"
    )
    parser.add_argument(
        "--frontend-only", 
        action="store_true", 
        help="只运行前端测试"
    )
    parser.add_argument(
        "--performance", 
        action="store_true", 
        help="包含性能测试"
    )
    
    args = parser.parse_args()
    
    if not args.frontend_only:
        run_backend_tests(performance=args.performance)
    
    if not args.backend_only:
        run_frontend_tests()
    
    print("\n===== 所有测试完成 =====")

if __name__ == "__main__":
    main()