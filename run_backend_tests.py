#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
后端测试运行脚本
用于执行特定的后端测试或所有后端测试
"""

import os
import sys
import subprocess
import argparse

# 测试文件路径
TEST_PATHS = {
    'paper_search': 'backend/tests/test_paper_search.py',
    'research_project': 'backend/tests/test_research_project.py',
    'performance': 'backend/tests/performance/test_research_performance.py',
    'all': 'backend/tests'  # 所有测试
}

def run_test(test_type, verbose=False, coverage=False):
    """运行指定类型的测试"""
    if test_type not in TEST_PATHS:
        print(f"错误: 未知的测试类型 '{test_type}'")
        print("可用的测试类型:")
        for type_name in TEST_PATHS:
            print(f"  - {type_name}{' (默认)' if type_name == 'all' else ''}")
        return 1
    
    # 构建测试命令
    cmd = ['pytest', TEST_PATHS[test_type]]
    
    if verbose:
        cmd.append('-v')
    
    if coverage:
        cmd.append('--cov=backend/src')
    
    print(f"\n===== 运行后端测试: {test_type} =====")
    print(f"执行命令: {' '.join(cmd)}\n")
    
    # 执行测试命令
    result = subprocess.run(cmd)
    
    if result.returncode == 0:
        print("\n===== 测试完成 =====")
        return 0
    else:
        print("\n测试执行失败")
        return 1

def main():
    parser = argparse.ArgumentParser(description="运行 AI 研究助手项目的后端测试")
    parser.add_argument(
        "test_type",
        nargs='?',
        default="all",
        choices=list(TEST_PATHS.keys()),
        help="要运行的测试类型"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="显示详细的测试输出"
    )
    parser.add_argument(
        "--coverage",
        action="store_true",
        help="生成测试覆盖率报告"
    )
    
    args = parser.parse_args()
    
    return run_test(args.test_type, args.verbose, args.coverage)

if __name__ == "__main__":
    sys.exit(main())