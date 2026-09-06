with open("main.py", "r") as f:
    content = f.read()

old_query_block = """            if payload.get("type") == "query":
                user_msg = payload.get("message")
                image_b64 = payload.get("image_b64")
                
                # Broadcast user message to ALL connected team members in this chat
                await broadcast(chat_id, {
                    "type": "message",
                    "message": {"role": "user", "content": user_msg}
                })
                
                async def stream_callback(msg_type: str, content: str):
                    await broadcast(chat_id, {
                        "type": msg_type,
                        "content": content
                    })
                    
                requested_model = payload.get("model", "Auto")
                final_answer = await store.run_agent_loop(
                    chat_id=chat_id,
                    user_prompt=user_msg, 
                    image_b64=image_b64, 
                    stream_callback=stream_callback,
                    requested_model=requested_model
                )
                
                await broadcast(chat_id, {
                    "type": "message",
                    "message": {"role": "assistant", "content": final_answer}
                })"""

new_query_block = """            if payload.get("type") == "query":
                user_msg = payload.get("message")
                image_b64 = payload.get("image_b64")
                sender_name = payload.get("sender_name")
                
                # Broadcast user message to ALL connected team members in this chat
                await broadcast(chat_id, {
                    "type": "message",
                    "message": {"role": "user", "content": user_msg, "sender_name": sender_name}
                })
                
                async def stream_callback(msg_type: str, content: str):
                    await broadcast(chat_id, {
                        "type": msg_type,
                        "content": content
                    })
                    
                requested_model = payload.get("model", "Auto")
                final_answer = await store.run_agent_loop(
                    chat_id=chat_id,
                    user_prompt=user_msg, 
                    image_b64=image_b64, 
                    stream_callback=stream_callback,
                    requested_model=requested_model,
                    sender_name=sender_name
                )
                
                await broadcast(chat_id, {
                    "type": "message",
                    "message": {"role": "assistant", "content": final_answer}
                })"""

if old_query_block in content:
    content = content.replace(old_query_block, new_query_block)
    with open("main.py", "w") as f:
        f.write(content)
    print("Fixed main.py")
else:
    print("Could not find the block to replace.")
