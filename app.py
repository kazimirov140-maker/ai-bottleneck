llama_container.empty()
    llama_container.success(llama_ans)
    
    # 2. Запрос к мощной Llama 3.3 70B
    llama_70b_ans = ask_groq("llama-3.3-70b-versatile", user_input)
    llama_70b_container.empty()
    llama_70b_container.success(llama_70b_ans)
    
    # 3. Запрос ко второй Llama 3.1 8B (временно вместо Gemma)
    gemma_ans = ask_groq("llama-3.1-8b-instant", user_input)
    gemma_container.empty()
    gemma_container.success(gemma_ans)
    
    # 4. Финальный сквозной синтез силами DeepSeek
    analysis_placeholder.warning("DeepSeek проводит глубокий анализ результатов...")
    
    synthesis_prompt = f"""
    Перед тобой три независимых ответа нейросетей на один и тот же вопрос: "{user_input}".
    Твоя задача: как экспертная модель DeepSeek, критически сопоставить эти ответы, полностью убрать лишнюю воду, исправить фактологические или логические нестыковки и выдать один идеальный, структурированный, сухой остаток на русском языке.
    
    Ответ первой модели: {llama_ans}
    Ответ второй модели: {llama_70b_ans}
    Ответ третьей модели: {gemma_ans}
    """
    
    # Направляем на синтез в тяжелую модель (которая выполняет роль DeepSeek-анализатора)
    final_analysis = ask_groq("llama-3.3-70b-versatile", synthesis_prompt)
    analysis_placeholder.empty()
    analysis_placeholder.write(final_analysis)
