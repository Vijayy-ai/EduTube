"""
ThirdWeb SDK wrapper with monkey patch for Python 3.11+ compatibility
Import this module instead of importing ThirdWeb directly
"""

# First apply the monkey patch
import monkey_patch

# Now try to import ThirdWeb components
try:
    from thirdweb import ThirdwebSDK
    from thirdweb.types.nft import NFTMetadataInput
    
    print("ThirdWeb SDK imported successfully with compatibility patch")
    
    # Export the components for easy access
    __all__ = ['ThirdwebSDK', 'NFTMetadataInput']
    
except ImportError as e:
    print(f"Error importing ThirdWeb SDK: {e}")
    print("Falling back to simulation mode...")
    
    # Create stub classes for simulation mode
    class NFTMetadataInput:
        def __init__(self, name=None, description=None, image=None, external_url=None, attributes=None):
            self.name = name
            self.description = description
            self.image = image
            self.external_url = external_url
            self.attributes = attributes or []
    
    class ThirdwebSDK:
        @classmethod
        def from_private_key(cls, private_key, network, api_key):
            print(f"Simulated ThirdWeb SDK initialized for network: {network}")
            return cls()
            
        def get_contract(self, contract_address):
            print(f"Simulated contract access for: {contract_address}")
            return MockContract()
    
    class MockContract:
        @property
        def erc721(self):
            return MockERC721()
    
    class MockERC721:
        def mint_to(self, to_address, metadata):
            from datetime import datetime
            import hashlib
            import random
            
            # Generate a mock transaction result
            token_id = random.randint(1000000000, 9999999999)
            tx_hash = f"0x{hashlib.sha256(f'{to_address}-{token_id}-{datetime.now().timestamp()}'.encode()).hexdigest()[:64]}"
            
            # Return a mock transaction result
            return MockTransaction(token_id, tx_hash)
    
    class MockTransaction:
        def __init__(self, token_id, tx_hash):
            self.id = token_id
            self.receipt = MockReceipt(tx_hash)
            
        def __str__(self):
            return f"Transaction(id={self.id}, hash={self.receipt.transaction_hash})"
    
    class MockReceipt:
        def __init__(self, tx_hash):
            self.transaction_hash = tx_hash
    
    print("ThirdWeb SDK simulation stubs created successfully")
    
    # Export the components for easy access
    __all__ = ['ThirdwebSDK', 'NFTMetadataInput'] 